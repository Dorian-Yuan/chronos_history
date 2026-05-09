import type { AdvisorData, FactionData } from "./scenario";

export interface StatsDelta {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export interface FactionUpdate extends FactionData {
  is_new: boolean;
  is_destroyed: boolean;
}

export interface TurnResult {
  narrative: string;
  situation_update: string;
  date_display: string;
  headline: string;
  rumor: string;
  stats_delta: StatsDelta;
  advisors: AdvisorData[];
  factions_update: FactionUpdate[];
  hidden_consequences: string;
  is_game_over: boolean;
  game_over_reason?: string;
}
