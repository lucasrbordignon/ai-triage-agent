import { Conversation } from "@repo/shared/src/database/entities";
import { randomUUID } from "node:crypto";
import { ConversationStatus, Department } from "@repo/shared/src/database/enums";
import db from "../../../../infra/database";

export class ConversationRepository {

  async create(
    department?: Department
  ): Promise<Conversation> {

    const conversation: Conversation = {
      id: randomUUID(),
      status: ConversationStatus.ACTIVE,
      department: department,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.execute(
      `
      INSERT INTO conversations
      (id, status, department, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        conversation.id,
        conversation.status,
        conversation.department ?? null,
        conversation.created_at,
        conversation.updated_at
      ]
    );

    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    const result = await db.execute({
      sql: `SELECT * FROM conversations WHERE id = ?`,
      args: [id]
    });

    const row = result.rows as unknown as Conversation[];

    if (row.length === 0) {
      return null;
    }

    return row[0] as Conversation;
  }

  async updateStatus(
    id: string,
    status: ConversationStatus
  ) {

    await db.execute({
      sql: `
      UPDATE conversations
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      args: [status, id]
    });
  }
}