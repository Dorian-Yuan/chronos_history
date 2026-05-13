import type {
  AdvisorData,
  FactionData,
  AdvisorStatus,
  FactionLeaderStatus,
  OfficialRank,
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

export interface PlayerContextUpdate {
  nation_name?: string;
  leader_title?: string;
  background_summary?: string;
  change_reason: string;
  official_rank?: OfficialRank;
  superior_title?: string;
  superior_name?: string;
  previous_nation_name?: string;
  previous_leader_title?: string;
  previous_official_rank?: OfficialRank;
  previous_superior_title?: string;
  previous_superior_name?: string;
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
  player_context_update?: PlayerContextUpdate;
  is_game_over: boolean;
  game_over_reason?: string;
}
