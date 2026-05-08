import type { WorldState } from "./world-state";

export interface ScenarioConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  startYear: number;
  coverImage: string;
  initialWorldState: WorldState;
  historicalEvents: HistoricalEvent[];
  keyFigures: KeyFigure[];
  factions: FactionDefinition[];
  promptTemplate: string;
}

export interface HistoricalEvent {
  id: string;
  year: number;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  impact: Partial<WorldState>;
}

export interface KeyFigure {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  factionId: string;
  traits: string[];
}

export interface FactionDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  initialPower: number;
  initialInfluence: number;
}
