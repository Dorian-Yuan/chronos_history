import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProviderSetting } from "@/types";

interface SettingsStore {
  locale: string;
  theme: string;
  aiProvider: AIProviderSetting | null;
  experimentalMode: boolean;
  setLocale: (locale: string) => void;
  setTheme: (theme: string) => void;
  setAIProvider: (provider: AIProviderSetting) => void;
  getAIProvider: () => AIProviderSetting | null;
  setExperimentalMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      locale: "zh",
      theme: "dark",
      aiProvider: null,
      experimentalMode: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setAIProvider: (provider) => set({ aiProvider: provider }),
      getAIProvider: () => get().aiProvider,
      setExperimentalMode: (enabled) => set({ experimentalMode: enabled }),
    }),
    {
      name: "chronos_settings",
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        aiProvider: state.aiProvider,
        experimentalMode: state.experimentalMode,
      }),
    },
  ),
);
