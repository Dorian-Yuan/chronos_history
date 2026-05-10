import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface ToastData {
  message: string;
  type: ToastType;
}

interface UIStore {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  activeTab: "game" | "state" | "timeline" | "causal";
  isMobile: boolean;
  toast: ToastData | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSettingsOpen: (open: boolean) => void;
  setActiveTab: (tab: "game" | "state" | "timeline" | "causal") => void;
  setIsMobile: (mobile: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  settingsOpen: false,
  activeTab: "game",
  isMobile: false,
  toast: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((prev) => ({ sidebarOpen: !prev.sidebarOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
  showToast: (message, type = "info") => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toast: { message, type } });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 3000);
  },
  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toast: null });
  },
}));
