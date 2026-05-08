export interface EconomyState {
  gdp: number;
  trade: number;
  resources: number;
  inflation: number;
  unemployment: number;
}

export interface MilitaryState {
  power: number;
  defense: number;
  readiness: number;
  warStatus: string;
  casualties: number;
}

export interface DiplomacyRelation {
  factionId: string;
  factionName: string;
  relationType: "allied" | "friendly" | "neutral" | "tense" | "hostile";
  trust: number;
}

export interface FactionState {
  id: string;
  name: string;
  power: number;
  influence: number;
  hiddenActions: string[];
  isRevealed: boolean;
}

export interface TechnologyState {
  level: number;
  focus: string;
  breakthroughs: string[];
}

export interface CultureState {
  development: number;
  trends: string[];
  publicOpinion: string;
}

export interface WorldState {
  year: number;
  chaosLevel: number;
  deviations: string[];
  populationMood: string;
  geopoliticalStability: number;
  economy: EconomyState;
  military: MilitaryState;
  diplomacy: DiplomacyRelation[];
  factions: FactionState[];
  technology: TechnologyState;
  culture: CultureState;
}
