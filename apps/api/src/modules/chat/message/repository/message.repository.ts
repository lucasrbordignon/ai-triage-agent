import { Message } from '@repo/shared/src/database/entities'
import db from '../../../../infra/database'

export class MessageRepository {
  async create(params: {
    conversationId: string
    role: Message['role']
    content: string
  }): Promise<Message> {
    const result = await db.execute({
      sql: `
      INSERT INTO messages
      (conversation_id, role, content)
      VALUES (?, ?, ?)
      `,
      args: [params.conversationId, params.role, params.content]
    })
    const id = Number(result.lastInsertRowid)

    const message = await db.execute({
      sql: `SELECT * FROM messages WHERE id = ?`,
      args: [id]
    })

    return message.rows[0] as unknown as Message
  }

  async listByConversation(conversationId: string): Promise<Message[]> {
    return db
      .execute({
        sql: `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `,
        args: [conversationId]
      })
      .then((result) => result.rows as unknown as Message[])
  }
}
