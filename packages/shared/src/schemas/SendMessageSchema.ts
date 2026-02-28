import { z } from "zod";

export const SendMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1)
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;