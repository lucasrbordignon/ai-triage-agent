import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatService, ChatServiceError } from "./chat.service";
import { ConversationStatus, Department, MessageRole } from "@repo/shared/src/database/enums";
import { Conversation, Message } from "@repo/shared/src/database/entities";

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv-123",
    status: ConversationStatus.ACTIVE,
    department: undefined,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversation_id: "conv-123",
    role: MessageRole.USER,
    content: "olá",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ChatService", () => {
  let service: ChatService;
  let conversationRepo: any;
  let messageRepo: any;
  let agentService: any;

  beforeEach(() => {
    conversationRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    };

    messageRepo = {
      create: vi.fn().mockResolvedValue(makeMessage()),
      listByConversation: vi.fn().mockResolvedValue([]),
    };

    agentService = {
      chat: vi.fn().mockResolvedValue({
        message: "Como posso te ajudar?",
        transfer: false,
      }),
    };

    service = new ChatService(conversationRepo, messageRepo, agentService);
  });

  describe("sendMessage", () => {
    it("deve criar conversa nova quando conversationId não é informado", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());

      const result = await service.sendMessage({ content: "olá" });

      expect(conversationRepo.create).toHaveBeenCalledOnce();
      expect(conversationRepo.findById).not.toHaveBeenCalled();
      expect(result.conversationId).toBe("conv-123");
    });

    it("deve reutilizar conversa existente quando conversationId é informado", async () => {
      conversationRepo.findById.mockResolvedValue(makeConversation());

      await service.sendMessage({ conversationId: "conv-123", content: "olá" });

      expect(conversationRepo.findById).toHaveBeenCalledWith("conv-123");
      expect(conversationRepo.create).not.toHaveBeenCalled();
    });

    it("deve lançar CONVERSATION_NOT_FOUND quando conversationId não existe no banco", async () => {
      conversationRepo.findById.mockResolvedValue(null);

      await expect(
        service.sendMessage({ conversationId: "nao-existe", content: "olá" })
      ).rejects.toMatchObject({ code: "CONVERSATION_NOT_FOUND" });
    });

    it("deve lançar CONVERSATION_ALREADY_TRANSFERRED quando conversa já foi transferida", async () => {
      conversationRepo.findById.mockResolvedValue(
        makeConversation({ status: ConversationStatus.TRANSFERRED })
      );

      await expect(
        service.sendMessage({ conversationId: "conv-123", content: "olá" })
      ).rejects.toMatchObject({ code: "CONVERSATION_ALREADY_TRANSFERRED" });
    });

    it("deve salvar mensagem do usuário e resposta do agente", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());

      await service.sendMessage({ content: "olá" });

      expect(messageRepo.create).toHaveBeenCalledTimes(2);
      expect(messageRepo.create.mock.calls[0][0].role).toBe(MessageRole.USER);
      expect(messageRepo.create.mock.calls[1][0].role).toBe(MessageRole.ASSISTANT);
    });

    it("deve atualizar status para TRANSFERRED quando agente transfere", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());
      agentService.chat.mockResolvedValue({
        message: "Transferindo para o Financeiro.",
        transfer: true,
        department: Department.FINANCIAL,
        summary: "Cliente quer pagar boleto.",
      });

      const result = await service.sendMessage({ content: "quero pagar boleto" });

      expect(conversationRepo.updateStatus).toHaveBeenCalledWith(
        "conv-123",
        ConversationStatus.TRANSFERRED
      );
      expect(result.transfer).toBe(true);
      expect(result.department).toBe(Department.FINANCIAL);
    });

    it("não deve atualizar status quando agente não transfere", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());

      await service.sendMessage({ content: "olá" });

      expect(conversationRepo.updateStatus).not.toHaveBeenCalled();
    });

    it("deve lançar AGENT_UNAVAILABLE quando agente falha", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());
      agentService.chat.mockRejectedValue(new Error("connection refused"));

      await expect(
        service.sendMessage({ content: "olá" })
      ).rejects.toMatchObject({ code: "AGENT_UNAVAILABLE" });
    });

    it("deve lançar AGENT_INVALID_RESPONSE quando agente retorna mensagem vazia", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());
      agentService.chat.mockResolvedValue({ message: "", transfer: false });

      await expect(
        service.sendMessage({ content: "olá" })
      ).rejects.toMatchObject({ code: "AGENT_INVALID_RESPONSE" });
    });

    it("deve passar histórico formatado para o agente sem a mensagem atual", async () => {
      conversationRepo.create.mockResolvedValue(makeConversation());
      messageRepo.listByConversation.mockResolvedValue([
        makeMessage({ role: MessageRole.USER, content: "primeira mensagem" }),
        makeMessage({ role: MessageRole.ASSISTANT, content: "resposta anterior" }),
        makeMessage({ role: MessageRole.USER, content: "olá" }),
      ]);

      await service.sendMessage({ content: "olá" });

      const [formattedHistory] = agentService.chat.mock.calls[0];
      expect(formattedHistory).toHaveLength(2);
      expect(formattedHistory[0].content).toBe("primeira mensagem");
      expect(formattedHistory[1].content).toBe("resposta anterior");
    });
  });

  describe("getHistory", () => {
    it("deve retornar mensagens da conversa", async () => {
      conversationRepo.findById.mockResolvedValue(makeConversation());
      messageRepo.listByConversation.mockResolvedValue([
        makeMessage({ role: MessageRole.USER, content: "olá" }),
        makeMessage({ role: MessageRole.ASSISTANT, content: "Como posso ajudar?" }),
      ]);

      const result = await service.getHistory("conv-123");

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(MessageRole.USER);
      expect(result[1].role).toBe(MessageRole.ASSISTANT);
    });

    it("deve lançar CONVERSATION_NOT_FOUND quando conversa não existe", async () => {
      conversationRepo.findById.mockResolvedValue(null);

      await expect(service.getHistory("nao-existe")).rejects.toMatchObject({
        code: "CONVERSATION_NOT_FOUND",
      });

      expect(messageRepo.listByConversation).not.toHaveBeenCalled();
    });
  });
});