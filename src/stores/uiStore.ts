import { create } from "zustand";


interface UIStore {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  activeTab: "game" | "state" | "timeline" | "causal";
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveTab: (tab: "game" | "state" | "timeline" | "causal") => void;
  setIsMobile: (mobile: boolean) => void;
}


export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  settingsOpen: false,
  activeTab: "game",
  isMobile: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((prev) => ({ sidebarOpen: !prev.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
}));
