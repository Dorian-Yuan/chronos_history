import type { WorldState } from "./world-state";
import type { CabinetDebate } from "./advisor";

export interface SimulationTurn {
  narrative: string;
  worldStateUpdate: Partial<WorldState>;
  suggestedActions: string[];
  cabinetDebate: CabinetDebate;
  hiddenEvents: string[];
  revealedInfo: string[];
}

export interface SimulationResponse {
  narrative: string;
  worldStateUpdate: Partial<WorldState>;
  suggestedActions: string[];
  cabinetDebate: CabinetDebate;
  hiddenEvents: string[];
  revealedInfo: string[];
}
