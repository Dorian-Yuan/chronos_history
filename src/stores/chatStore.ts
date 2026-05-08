import { create } from "zustand";
import type { ChatMessage } from "@/types";

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, content: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setIsStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) =>
    set((prev) => ({ messages: [...prev.messages, message] })),
  updateMessage: (id, updates) =>
    set((prev) => ({
      messages: prev.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
  appendToMessage: (id, content) =>
    set((prev) => ({
      messages: prev.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + content } : m,
      ),
    })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
}));
