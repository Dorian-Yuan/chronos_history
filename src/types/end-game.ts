export type RadarDimension =
  | "Authority"
  | "Strategy"
  | "Empathy"
  | "Vision"
  | "Economy";

export interface RadarStat {
  dimension: RadarDimension;
  value: number;
  fullMark: number;
}

export interface TurnReview {
  turn: number;
  summary: string;
  commentary: string;
}

export interface EndGameAnalysis {
  real_event_title: string;
  real_outcome_summary: string;
  user_outcome_summary: string;
  comparison_text: string;
  similar_historical_figure: string;
  persona_title: string;
  persona_description: string;
  radar_stats: RadarStat[];
  turn_reviews: TurnReview[];
  modern_echo: string;
  alternative_history: string;
}
