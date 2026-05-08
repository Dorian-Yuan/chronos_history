import type { PlayStyle } from "./play-style";

export interface PlayerContext {
  nation_name: string;
  leader_title: string;
  background_summary: string;
}

export interface InitialStats {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export type AdvisorRole =
  | "General"
  | "Diplomat"
  | "Intel"
  | "Scholar"
  | "Merchant";

export interface AdvisorData {
  role: AdvisorRole;
  name: string;
  advice: string;
  bias: string;
  hidden_motive?: string;
}

export interface FactionData {
  name: string;
  description: string;
  strength: string;
  weakness: string;
  needs: string;
  attitude: string;
  is_new?: boolean;
  is_destroyed?: boolean;
}

export interface ScenarioData {
  id: string;
  title: string;
  description: string;
  player_context: PlayerContext;
  initial_stats: InitialStats;
  hidden_real_event: string;
  play_style: PlayStyle;
  start_date: string;
  initial_advisors: AdvisorData[];
  factions: FactionData[];
}
