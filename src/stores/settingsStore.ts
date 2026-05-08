import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProviderSetting } from "@/types";

interface SettingsStore {
  locale: string;
  theme: string;
  aiProvider: AIProviderSetting | null;
  setLocale: (locale: string) => void;
  setTheme: (theme: string) => void;
  setAIProvider: (provider: AIProviderSetting) => void;
  getAIProvider: () => AIProviderSetting | null;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      locale: "zh",
      theme: "dark",
      aiProvider: null,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setAIProvider: (provider) => set({ aiProvider: provider }),
      getAIProvider: () => get().aiProvider,
    }),
    {
      name: "chronos_settings",
    },
  ),
);
