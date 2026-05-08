import type { SimulationSession } from "@/types";
import { saveFullSession } from "./sessions";

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DELAY = 5000;

export function scheduleAutoSave(
  getSession: () => SimulationSession | null,
): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(async () => {
    const session = getSession();
    if (session) {
      try {
        await saveFullSession(session);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
    autoSaveTimer = null;
  }, AUTO_SAVE_DELAY);
}

export function cancelAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
}
