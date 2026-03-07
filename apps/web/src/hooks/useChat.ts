import { useState } from "react";
import { api } from "../services/api";
import type { AgentResponse } from "@repo/shared";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  transfer?: boolean;
  department?: string;
  summary?: string;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || isTransferred) return;

    const userMessage: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await api.post<AgentResponse & { conversationId: string }>(
        "/messages",
        {
          conversationId,
          content,
        }
      );

      const { message, transfer, department, summary, conversationId: newId } =
        res.data;

      if (newId && !conversationId) {
        setConversationId(newId);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: message,
        transfer,
        department,
        summary,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (transfer) {
        setIsTransferred(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    setIsTransferred(false);
  };

  return { messages, isLoading, isTransferred, sendMessage, reset };
}