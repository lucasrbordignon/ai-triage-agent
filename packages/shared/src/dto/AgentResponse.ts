import { Department } from "../database/enums";

export interface AgentResponse {
  message: string;
  transfer?: boolean;
  department?: Department;
  summary?: string;
  conversationId?: string;
}