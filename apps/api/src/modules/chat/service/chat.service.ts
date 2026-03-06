import { ConversationRepository } from "../conversation/repository/conversation.repository";
import { MessageRepository } from "../message/repository/message.repository";
import { AgentService } from "./agent.service";
import { AgentResponse } from "@repo/shared/src/dto/AgentResponse";
import { SendMessageDTO } from "@repo/shared/src/dto/MessageDTO";
import { ConversationStatus, MessageRole } from "@repo/shared/src/database/enums";
import { Message } from "@repo/shared/src/database/entities";

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

export class ChatService {
  constructor(
    private readonly conversationRepo = new ConversationRepository(),
    private readonly messageRepo = new MessageRepository(),
    private readonly agentService = new AgentService()
  ) {}

  async sendMessage(
    dto: SendMessageDTO
  ): Promise<AgentResponse & { conversationId: string }> {

    // 1. Busca ou cria conversa
    let conversation = dto.conversationId
      ? await this.conversationRepo.findById(dto.conversationId)
      : null;

    if (dto.conversationId && !conversation) {
      throw new ChatServiceError(
        `Conversa não encontrada: ${dto.conversationId}`,
        "CONVERSATION_NOT_FOUND"
      );
    }

    if (!conversation) {
      conversation = await this.conversationRepo.create();
    }

    // 2. Bloqueia envio em conversa já transferida
    if (conversation.status === ConversationStatus.TRANSFERRED) {
      throw new ChatServiceError(
        "Esta conversa já foi transferida para um atendente humano.",
        "CONVERSATION_ALREADY_TRANSFERRED"
      );
    }

    // 3. Salva mensagem do usuário
    await this.messageRepo.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: dto.content  || "",
    });

    // 4. Busca histórico para contexto da IA
    const history = await this.messageRepo.listByConversation(conversation.id);
    const formattedHistory = this.formatHistory(history, dto.content || "");

    // 5. Chama o agente
    let agentResponse: AgentResponse;

    try {
      agentResponse = await this.agentService.chat(
        formattedHistory,
        dto.content || ""
      );
    } catch (err) {
      console.error("[ChatService] AgentService error:", err);
      throw new ChatServiceError(
        "O agente de IA não está disponível no momento.",
        "AGENT_UNAVAILABLE"
      );
    }

    // 6. Garante que a resposta tem conteúdo
    if (!agentResponse.message) {
      throw new ChatServiceError(
        "O agente retornou uma resposta inválida.",
        "AGENT_INVALID_RESPONSE"
      );
    }

    // 7. Salva resposta da IA
    await this.messageRepo.create({
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      content: agentResponse.message,
    });

    // 8. Se transferiu, atualiza status da conversa
    if (agentResponse.transfer && agentResponse.department) {
      await this.conversationRepo.updateStatus(
        conversation.id,
        ConversationStatus.TRANSFERRED
      );
    }

    return {
      ...agentResponse,
      conversationId: conversation.id,
    };
  }

  async getHistory(conversationId: string): Promise<Message[]> {
    const conversation = await this.conversationRepo.findById(conversationId);

    if (!conversation) {
      throw new ChatServiceError(
        `Conversa não encontrada: ${conversationId}`,
        "CONVERSATION_NOT_FOUND"
      );
    }

    return this.messageRepo.listByConversation(conversationId);
  }

  private formatHistory(messages: Message[], currentMessage: string) {
    return messages
      .filter((m) => m.content !== currentMessage)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }
}