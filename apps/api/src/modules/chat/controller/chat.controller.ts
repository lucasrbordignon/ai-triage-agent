import { Request, Response } from 'express'
import { ChatService, ChatServiceError } from '../service/chat.service'
import { z } from 'zod'

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional().nullable(),
  content: z
    .string({ error: 'content é obrigatório' })
    .min(1, 'content não pode ser vazio')
    .max(1000, 'content não pode ter mais de 1000 caracteres')
    .trim()
})

const getHistorySchema = z.object({
  conversationId: z
    .string({ error: 'conversationId é obrigatório' })
    .uuid('conversationId deve ser um UUID válido')
})

export class ChatController {
  constructor(private readonly chatService = new ChatService()) {}

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const parsed = sendMessageSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors
      })
      return
    }

    try {
      const response = await this.chatService.sendMessage(parsed.data)
      res.json(response)
    } catch (err) {
      console.error('[ChatController] sendMessage error:', err)
      res.status(500).json({
        error: 'Erro interno ao processar a mensagem. Tente novamente.'
      })
    }
  }

  getHistory = async (req: Request, res: Response): Promise<void> => {
    const parsed = getHistorySchema.safeParse(req.query)

    if (!parsed.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors
      })
      return
    }

    try {
      const messages = await this.chatService.getHistory(
        parsed.data.conversationId
      )
      res.json(messages)
    } catch (err) {
      if (err instanceof ChatServiceError) {
        const status =
          err.code === 'CONVERSATION_NOT_FOUND'
            ? 404
            : err.code === 'CONVERSATION_ALREADY_TRANSFERRED'
              ? 409
              : 500
        res.status(status).json({ error: err.message, code: err.code })
        return
      }
      console.error('[ChatController] getHistory error:', err)
      res.status(500).json({
        error: 'Erro interno ao buscar histórico. Tente novamente.'
      })
    }
  }
}
