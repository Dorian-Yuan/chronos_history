export interface SaveMetadata {
  slotId: "autosave" | "slot_0" | "slot_1" | "slot_2" | "slot_3" | "slot_4";
  scenarioTitle: string;
  nationName: string;
  leaderTitle: string;
  turnCount: number;
  timestamp: number;
  outcome?: "victory" | "neutral" | "defeat";
}

export interface SaveData {
  metadata: SaveMetadata;
  state: import("./game-state").GameState;
  version: number;
}

export interface HistoryRecord {
  id: string;
  scenarioTitle: string;
  nationName: string;
  leaderTitle: string;
  turnCount: number;
  outcome: "victory" | "neutral" | "defeat";
  realEventTitle: string;
  personaTitle: string;
  timestamp: number;
}

export interface CompendiumEntry {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

export const MAX_HISTORY_RECORDS = 50;
export const SAVE_VERSION = 1;
export const FULL_EXPORT_VERSION = 1;

export interface FullExportData {
  version: number;
  exportTimestamp: number;
  saves: {
    autosave: SaveData | null;
    slots: (SaveData | null)[];
  };
  historyRecords: HistoryRecord[];
  compendium: {
    persona: CompendiumEntry[];
    history: CompendiumEntry[];
  };
}
