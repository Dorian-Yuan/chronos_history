import type {
  AdvisorData,
  FactionData,
  AdvisorStatus,
  FactionLeaderStatus,
} from "./scenario";

export interface DecisionOption {
  title: string;
  description: string;
  recommended_advisor: string;
}

export interface StatsDelta {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export interface FactionUpdate extends FactionData {
  is_new: boolean;
  is_destroyed: boolean;
  leader_status?: FactionLeaderStatus;
}

export interface AdvisorUpdate extends AdvisorData {
  status?: AdvisorStatus;
}

export interface TurnResult {
  narrative: string;
  situation_update: string;
  date_display: string;
  headline: string;
  rumor: string;
  historian_commentary: string;
  stats_delta: StatsDelta;
  advisors: AdvisorUpdate[];
  factions_update: FactionUpdate[];
  hidden_consequences: string;
  decision_options: DecisionOption[];
  is_game_over: boolean;
  game_over_reason?: string;
}
