import { create } from "zustand";
import type { SessionMetadata } from "@/types";

interface SessionStore {
  sessions: SessionMetadata[];
  currentSessionId: string | null;
  setSessions: (sessions: SessionMetadata[]) => void;
  addSession: (session: SessionMetadata) => void;
  updateSession: (id: string, updates: Partial<SessionMetadata>) => void;
  removeSession: (id: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  getCurrentSession: () => SessionMetadata | undefined;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((prev) => ({ sessions: [session, ...prev.sessions] })),
  updateSession: (id, updates) =>
    set((prev) => ({
      sessions: prev.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    })),
  removeSession: (id) =>
    set((prev) => ({
      sessions: prev.sessions.filter((s) => s.id !== id),
      currentSessionId:
        prev.currentSessionId === id ? null : prev.currentSessionId,
    })),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  getCurrentSession: () => {
    const { sessions, currentSessionId } = get();
    return sessions.find((s) => s.id === currentSessionId);
  },
}));
