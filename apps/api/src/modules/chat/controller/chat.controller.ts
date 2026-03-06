import { Request, Response } from "express";
import { ChatService } from "../service/chat.service";
import { SendMessageDTO } from "@repo/shared/src/dto/MessageDTO";

export class ChatController {
  constructor(private readonly chatService = new ChatService()) {}

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const dto: SendMessageDTO = req.body;

    if (!dto.content) {
      res.status(400).json({ error: "content é obrigatório" });
      return;
    }

    const response = await this.chatService.sendMessage(dto);
    res.json(response);
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.query;

    if (!conversationId || typeof conversationId !== "string") {
      res.status(400).json({ error: "conversationId é obrigatório" });
      return;
    }

    const messages = await this.chatService.getHistory(conversationId);
    res.json(messages);
  };
}