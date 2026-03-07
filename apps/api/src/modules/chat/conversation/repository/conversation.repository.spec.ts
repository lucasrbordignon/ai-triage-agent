import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConversationRepository } from "./conversation.repository";
import { ConversationStatus, Department } from "@repo/shared/src/database/enums";

const mockExecute = vi.hoisted(() => vi.fn());

vi.mock("../../../../infra/database/index", () => ({
  default: { execute: mockExecute },
}));

function makeConversationRow(overrides = {}) {
  return {
    id: "uuid-123",
    status: ConversationStatus.ACTIVE,
    department: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ConversationRepository", () => {
  let repo: ConversationRepository;

  beforeEach(() => {
    repo = new ConversationRepository();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("deve inserir uma conversa e retornar o objeto criado", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await repo.create();

      expect(mockExecute).toHaveBeenCalledOnce();

      const [sql, args] = mockExecute.mock.calls[0];
      expect(sql).toContain("INSERT INTO conversations");
      expect(args[1]).toBe(ConversationStatus.ACTIVE);
      expect(args[2]).toBeNull(); // department null por padrão

      expect(result.status).toBe(ConversationStatus.ACTIVE);
      expect(result.id).toBeDefined();
    });

    it("deve criar conversa com departamento quando informado", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await repo.create(Department.FINANCIAL);

      const [, args] = mockExecute.mock.calls[0];
      expect(args[2]).toBe(Department.FINANCIAL);
      expect(result.department).toBe(Department.FINANCIAL);
    });
  });

  describe("findById", () => {
    it("deve retornar a conversa quando encontrada", async () => {
      const row = makeConversationRow({ id: "uuid-abc" });
      mockExecute.mockResolvedValueOnce({ rows: [row] });

      const result = await repo.findById("uuid-abc");

      expect(result).toEqual(row);
      const call = mockExecute.mock.calls[0][0];
      expect(call.args).toContain("uuid-abc");
    });

    it("deve retornar null quando não encontrada", async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findById("nao-existe");

      expect(result).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("deve chamar UPDATE com status e id corretos", async () => {
      mockExecute.mockResolvedValueOnce({});

      await repo.updateStatus("uuid-123", ConversationStatus.TRANSFERRED);

      const call = mockExecute.mock.calls[0][0];
      expect(call.sql).toContain("UPDATE conversations");
      expect(call.args).toContain(ConversationStatus.TRANSFERRED);
      expect(call.args).toContain("uuid-123");
    });
  });
});