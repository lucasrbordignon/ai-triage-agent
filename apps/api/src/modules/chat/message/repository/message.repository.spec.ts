import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageRepository } from "./message.repository";
import { MessageRole } from "@repo/shared/src/database/enums";

const mockExecute = vi.hoisted(() => vi.fn());

vi.mock("../../../../infra/database/index", () => ({
  default: { execute: mockExecute },
}));

function makeMessageRow(overrides = {}) {
  return {
    id: 1,
    conversation_id: "conv-123",
    role: MessageRole.USER,
    content: "Olá, preciso de ajuda",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("MessageRepository", () => {
  let repo: MessageRepository;

  beforeEach(() => {
    repo = new MessageRepository();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("deve inserir mensagem e retornar o registro criado", async () => {
      const row = makeMessageRow();

      mockExecute.mockResolvedValueOnce({ lastInsertRowid: BigInt(1) });

      mockExecute.mockResolvedValueOnce({ rows: [row] });

      const result = await repo.create({
        conversationId: "conv-123",
        role: MessageRole.USER,
        content: "Olá, preciso de ajuda",
      });

      expect(mockExecute).toHaveBeenCalledTimes(2);

      const insertCall = mockExecute.mock.calls[0][0];
      expect(insertCall.sql).toContain("INSERT INTO messages");
      expect(insertCall.args).toContain("conv-123");
      expect(insertCall.args).toContain(MessageRole.USER);
      expect(insertCall.args).toContain("Olá, preciso de ajuda");

      const selectCall = mockExecute.mock.calls[1][0];
      expect(selectCall.args).toContain(1);

      expect(result).toEqual(row);
    });
  });

  describe("listByConversation", () => {
    it("deve retornar mensagens ordenadas da conversa", async () => {
      const rows = [
        makeMessageRow({ id: 1, content: "Primeira" }),
        makeMessageRow({ id: 2, content: "Segunda", role: MessageRole.ASSISTANT }),
      ];
      mockExecute.mockResolvedValueOnce({ rows });

      const result = await repo.listByConversation("conv-123");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Primeira");
      expect(result[1].role).toBe(MessageRole.ASSISTANT);

      const call = mockExecute.mock.calls[0][0];
      expect(call.sql).toContain("ORDER BY created_at ASC");
      expect(call.args).toContain("conv-123");
    });

    it("deve retornar array vazio quando não há mensagens", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await repo.listByConversation("conv-sem-mensagens");

      expect(result).toEqual([]);
    });
  });
});