import { useState, useRef, useEffect } from "react";
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
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedId = sessionStorage.getItem("conversationId");
    if (!savedId) return;

    setConversationId(savedId);
    api
      .get<ChatMessage[]>(`/messages?conversationId=${savedId}`)
      .then((res) => {
        const history: ChatMessage[] = res.data.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(history);
      })
      .catch(() => {
        sessionStorage.removeItem("conversationId");
      });
  }, []);

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
        sessionStorage.setItem("conversationId", newId);
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
    sessionStorage.removeItem("conversationId");
  };

  return { messages, isLoading, isTransferred, sendMessage, reset };
}