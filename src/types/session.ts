import type { ChatMessage } from "./chat";
import type { WorldState } from "./world-state";
import type { AdvisorOpinion } from "./advisor";
import type { CausalNode, CharacterRelation } from "./causal";

export interface HistoryPoint {
  year: number;
  chaos: number;
}

export interface SessionMetadata {
  id: string;
  title: string;
  lastUpdated: number;
  year: number;
  scenarioId: string;
}

export interface SimulationSession {
  metadata: SessionMetadata;
  messages: ChatMessage[];
  worldState: WorldState | null;
  historyPoints: HistoryPoint[];
  suggestedActions: string[];
  backgroundImage: string | null;
  cabinetDebate?: AdvisorOpinion[];
  causalChain: CausalNode[];
  characterRelations: CharacterRelation[];
}
