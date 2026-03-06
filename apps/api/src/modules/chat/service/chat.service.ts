import { ConversationRepository } from "../conversation/repository/conversation.repository";
import { MessageRepository } from "../message/repository/message.repository";
import { AgentService } from "./agent.service";
import { AgentResponse } from "@repo/shared/src/dto/AgentResponse";
import { SendMessageDTO } from "@repo/shared/src/dto/MessageDTO";
import { ConversationStatus, MessageRole } from "@repo/shared/src/database/enums";
import { Message } from "@repo/shared/src/database/entities";

export class ChatService {
  constructor(
    private readonly conversationRepo = new ConversationRepository(),
    private readonly messageRepo = new MessageRepository(),
    private readonly agentService = new AgentService()
  ) {}

  async sendMessage(dto: SendMessageDTO): Promise<AgentResponse> {
    // 1. Busca ou cria conversa
    let conversation = dto.conversationId
      ? await this.conversationRepo.findById(dto.conversationId)
      : null;

    if (!conversation) {
      conversation = await this.conversationRepo.create();
    }

    // 2. Salva mensagem do usuário
    await this.messageRepo.create({
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: dto.content,
    });

    // 3. Busca histórico para contexto da IA
    const history = await this.messageRepo.listByConversation(conversation.id);
    const formattedHistory = this.formatHistory(history, dto.content);

    // 4. Chama o agente
    const agentResponse = await this.agentService.chat(
      formattedHistory,
      dto.content
    );

    // 5. Salva resposta da IA
    await this.messageRepo.create({
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      content: agentResponse.message,
    });

    // 6. Se transferiu, atualiza status da conversa
    if (agentResponse.transfer && agentResponse.department) {
      await this.conversationRepo.updateStatus(
        conversation.id,
        ConversationStatus.TRANSFERRED
      );
    }

    return {
      ...agentResponse,
      conversationId: conversation.id,
    } as AgentResponse & { conversationId: string };
  }

  async getHistory(conversationId: string) {
    return this.messageRepo.listByConversation(conversationId);
  }

  private formatHistory(messages: Message[], currentMessage: string) {
    // Remove a última mensagem do usuário pois ela será adicionada pelo AgentService
    return messages
      .filter((m) => m.content !== currentMessage)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }
}