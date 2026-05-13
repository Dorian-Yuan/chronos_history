import type {
  GameState,
  SaveData,
  HistoryRecord,
  CompendiumEntry,
  FullExportData,
} from "@/types";
import {
  SAVE_VERSION,
  MAX_HISTORY_RECORDS,
  FULL_EXPORT_VERSION,
} from "@/types";

const AUTOSAVE_KEY = "chronos_autosave";
const SAVE_KEY_PREFIX = "chronos_save_";
const HISTORY_KEY = "chronos_history";
const COMPENDIUM_PERSONA_KEY = "chronos_compendium_persona";
const COMPENDIUM_HISTORY_KEY = "chronos_compendium_history";

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

export function exportAllData(): string {
  const data: FullExportData = {
    version: FULL_EXPORT_VERSION,
    exportTimestamp: Date.now(),
    saves: {
      autosave: loadAutoSave(),
      slots: Array.from({ length: 5 }, (_, i) => loadFromSlot(i)),
    },
    historyRecords: getHistoryRecords(),
    compendium: {
      persona: getPersonaCompendium(),
      history: getHistoryCompendium(),
    },
  };
  return JSON.stringify(data, null, 2);
}

export function importSave(jsonString: string): SaveData | null {
  try {
    const data = JSON.parse(jsonString);

    if (data.saves !== undefined) {
      const autosave = data.saves?.autosave;
      if (autosave?.state?.scenario && autosave?.state?.stats) {
        return autosave as SaveData;
      }
      const firstSlot = (
        data.saves?.slots as (SaveData | null)[] | undefined
      )?.find((s) => s?.state?.scenario && s?.state?.stats);
      return firstSlot || null;
    }

    if (data.state && data.state.scenario && data.state.stats) {
      return data as SaveData;
    }

    return null;
  } catch {
    return null;
  }
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as FullExportData;
    if (!data.version || !data.saves) return false;

    if (data.saves.autosave) {
      saveToLocalStorage(AUTOSAVE_KEY, data.saves.autosave);
    }
    data.saves.slots.forEach((slotData, i) => {
      if (slotData) {
        saveToLocalStorage(`${SAVE_KEY_PREFIX}${i}`, slotData);
      }
    });

    const existingHistory = getHistoryRecords();
    const newHistory = (data.historyRecords || []).filter(
      (nr) => !existingHistory.some((er) => er.id === nr.id),
    );
    const mergedHistory = [...newHistory, ...existingHistory]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_RECORDS);
    saveToLocalStorage(HISTORY_KEY, mergedHistory);

    const existingPersona = getPersonaCompendium();
    const newPersona = (data.compendium?.persona || []).filter(
      (ne) => !existingPersona.some((ee) => ee.title === ne.title),
    );
    saveToLocalStorage(COMPENDIUM_PERSONA_KEY, [
      ...existingPersona,
      ...newPersona,
    ]);

    const existingHistoryComp = getHistoryCompendium();
    const newHistoryComp = (data.compendium?.history || []).filter(
      (ne) => !existingHistoryComp.some((ee) => ee.title === ne.title),
    );
    saveToLocalStorage(COMPENDIUM_HISTORY_KEY, [
      ...existingHistoryComp,
      ...newHistoryComp,
    ]);

    return true;
  } catch {
    return false;
  }
}

export function addToPersonaCompendium(
  personaTitle: string,
  personaDescription: string,
): void {
  const entries =
    loadFromLocalStorage<CompendiumEntry[]>(COMPENDIUM_PERSONA_KEY) || [];
  if (entries.some((e) => e.title === personaTitle)) return;
  entries.push({
    id: `persona_${Date.now()}`,
    title: personaTitle,
    description: personaDescription,
    timestamp: Date.now(),
  });
  saveToLocalStorage(COMPENDIUM_PERSONA_KEY, entries);
}

export function addToHistoryCompendium(
  eventTitle: string,
  outcomeSummary: string,
): void {
  const entries =
    loadFromLocalStorage<CompendiumEntry[]>(COMPENDIUM_HISTORY_KEY) || [];
  if (entries.some((e) => e.title === eventTitle)) return;
  entries.push({
    id: `history_${Date.now()}`,
    title: eventTitle,
    description: outcomeSummary,
    timestamp: Date.now(),
  });
  saveToLocalStorage(COMPENDIUM_HISTORY_KEY, entries);
}

export function getPersonaCompendium(): CompendiumEntry[] {
  return loadFromLocalStorage<CompendiumEntry[]>(COMPENDIUM_PERSONA_KEY) || [];
}

export function getHistoryCompendium(): CompendiumEntry[] {
  return loadFromLocalStorage<CompendiumEntry[]>(COMPENDIUM_HISTORY_KEY) || [];
}
