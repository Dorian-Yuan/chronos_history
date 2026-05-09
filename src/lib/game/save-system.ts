import type { GameState, SaveData, HistoryRecord } from "@/types";
import { SAVE_VERSION, MAX_HISTORY_RECORDS } from "@/types";

const AUTOSAVE_KEY = "chronos_autosave";
const SAVE_KEY_PREFIX = "chronos_save_";
const HISTORY_KEY = "chronos_history";

function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
}

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function autoSave(state: GameState): void {
  if (state.turnCount < 1 || !state.scenario) return;

  const data: SaveData = {
    metadata: {
      slotId: "autosave",
      scenarioTitle: state.scenario.title,
      nationName: state.scenario.player_context.nation_name,
      leaderTitle: state.scenario.player_context.leader_title,
      turnCount: state.turnCount,
      timestamp: Date.now(),
    },
    state,
    version: SAVE_VERSION,
  };
  saveToLocalStorage(AUTOSAVE_KEY, data);
}

export function loadAutoSave(): SaveData | null {
  return loadFromLocalStorage<SaveData>(AUTOSAVE_KEY);
}

export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}

export function saveToSlot(slotIndex: number, state: GameState): void {
  if (!state.scenario) return;

  const data: SaveData = {
    metadata: {
      slotId: `slot_${slotIndex}` as SaveData["metadata"]["slotId"],
      scenarioTitle: state.scenario.title,
      nationName: state.scenario.player_context.nation_name,
      leaderTitle: state.scenario.player_context.leader_title,
      turnCount: state.turnCount,
      timestamp: Date.now(),
    },
    state,
    version: SAVE_VERSION,
  };
  saveToLocalStorage(`${SAVE_KEY_PREFIX}${slotIndex}`, data);
}

export function loadFromSlot(slotIndex: number): SaveData | null {
  return loadFromLocalStorage<SaveData>(`${SAVE_KEY_PREFIX}${slotIndex}`);
}

export function deleteSlot(slotIndex: number): void {
  localStorage.removeItem(`${SAVE_KEY_PREFIX}${slotIndex}`);
}

export function getAllSaves(): { slotIndex: number; data: SaveData }[] {
  const saves: { slotIndex: number; data: SaveData }[] = [];
  for (let i = 0; i < 5; i++) {
    const data = loadFromSlot(i);
    if (data) saves.push({ slotIndex: i, data });
  }
  return saves;
}

export function addHistoryRecord(record: HistoryRecord): void {
  const history = loadFromLocalStorage<HistoryRecord[]>(HISTORY_KEY) || [];
  history.unshift(record);
  if (history.length > MAX_HISTORY_RECORDS) {
    history.length = MAX_HISTORY_RECORDS;
  }
  saveToLocalStorage(HISTORY_KEY, history);
}

export function getHistoryRecords(): HistoryRecord[] {
  return loadFromLocalStorage<HistoryRecord[]>(HISTORY_KEY) || [];
}

export function exportSave(state: GameState): string {
  const data: SaveData = {
    metadata: {
      slotId: "slot_0",
      scenarioTitle: state.scenario?.title || "",
      nationName: state.scenario?.player_context.nation_name || "",
      leaderTitle: state.scenario?.player_context.leader_title || "",
      turnCount: state.turnCount,
      timestamp: Date.now(),
    },
    state,
    version: SAVE_VERSION,
  };
  return JSON.stringify(data, null, 2);
}

export function importSave(jsonString: string): SaveData | null {
  try {
    const data = JSON.parse(jsonString) as SaveData;
    if (!data.state || !data.state.scenario || !data.state.stats) return null;
    return data;
  } catch {
    return null;
  }
}
