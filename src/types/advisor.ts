export type AdvisorRole =
  | "economist"
  | "military"
  | "diplomat"
  | "public_sentiment";

export interface AdvisorOpinion {
  advisor: AdvisorRole;
  intervention: string;
  reasoning: string;
  riskAssessment: string;
  confidence: number;
}

export interface CabinetDebate {
  opinions: AdvisorOpinion[];
  conflicts: string[];
  consensus: string | null;
}
