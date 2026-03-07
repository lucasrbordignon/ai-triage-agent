import { Department, ConversationStatus, MessageRole } from "./enums";

export interface Conversation {
  id: string;
  status: ConversationStatus;
  department?: Department;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  role: MessageRole;
  content: string ;
  created_at: string;
}