import type { PlayStyle } from "./play-style";
import type { DecisionOption } from "./turn-result";

export type AdvisorRole =
  | "General"
  | "Diplomat"
  | "Intel"
  | "Scholar"
  | "Merchant";

export type AdvisorStatus = "active" | "dead" | "exiled" | "retired";

export type FactionLeaderStatus = "active" | "dead" | "exiled" | "overthrown";

export interface OfficialRank {
  level: number;
  title: string;
  department: string;
  is_military: boolean;
}

export interface PlayerContext {
  nation_name: string;
  leader_title: string;
  background_summary: string;
  official_rank?: OfficialRank;
  superior_title?: string;
  superior_name?: string;
}

export interface AdvisorData {
  role: AdvisorRole;
  name: string;
  advice: string;
  bias: string;
  hidden_motive?: string;
  status?: AdvisorStatus;
}

export interface FactionData {
  name: string;
  leader?: string;
  leader_status?: FactionLeaderStatus;
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
  initial_stats: {
    stability: number;
    economy: number;
    military: number;
    international_standing: number;
  };
  hidden_real_event: string;
  play_style: PlayStyle;
  start_date: string;
  initial_advisors: AdvisorData[];
  factions: FactionData[];
  initial_decision_options?: DecisionOption[];
}
