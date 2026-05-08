import { create } from "zustand";
import type { WorldState, HistoryPoint } from "@/types";

interface WorldStateStore {
  worldState: WorldState | null;
  historyPoints: HistoryPoint[];
  setWorldState: (state: WorldState) => void;
  updateWorldState: (update: Partial<WorldState>) => void;
  resetWorldState: () => void;
  addHistoryPoint: (point: HistoryPoint) => void;
}

export const useWorldStateStore = create<WorldStateStore>((set) => ({
  worldState: null,
  historyPoints: [],
  setWorldState: (state) => set({ worldState: state }),
  updateWorldState: (update) =>
    set((prev) => ({
      worldState: prev.worldState ? { ...prev.worldState, ...update } : null,
    })),
  resetWorldState: () => set({ worldState: null, historyPoints: [] }),
  addHistoryPoint: (point) =>
    set((prev) => ({
      historyPoints: [...prev.historyPoints, point],
    })),
}));
