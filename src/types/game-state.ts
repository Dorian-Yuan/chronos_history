import type { ScenarioData, AdvisorRole } from "./scenario";
import type { TurnResult } from "./turn-result";
import type { EndGameAnalysis } from "./end-game";
import { getAppConfig } from "@/config";

export interface GameStats {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export type GamePhase = "start" | "selection" | "playing" | "ended";

export interface CounselMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CounselSession {
  advisorRole: AdvisorRole;
  messages: CounselMessage[];
}

export interface GameState {
  phase: GamePhase;
  scenario: ScenarioData | null;
  stats: GameStats;
  turnCount: number;
  historyLog: string[];
  currentTurnResult: TurnResult | null;
  endGameAnalysis: EndGameAnalysis | null;
  turnResults: TurnResult[];
}

export type GameOutcome = "victory" | "neutral" | "defeat";

export const INITIAL_GAME_STATE: GameState = {
  phase: "start",
  scenario: null,
  stats: {
    stability: 50,
    economy: 50,
    military: 50,
    international_standing: 50,
  },
  turnCount: 0,
  historyLog: [],
  currentTurnResult: null,
  endGameAnalysis: null,
  turnResults: [],
};

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function determineOutcome(stats: GameStats): GameOutcome {
  const anyZero = Object.values(stats).some((v) => v <= 0);
  if (anyZero) return "defeat";
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / 4;
  if (avg >= 65) return "victory";
  if (avg >= 40) return "neutral";
  return "defeat";
}

export function checkGameOver(
  state: GameState,
  turnResult: TurnResult,
): boolean {
  const config = getAppConfig();
  const nextTurn = state.turnCount + 1;
  const anyStatZero = Object.values(state.stats).some((v) => v <= 0);
  const hardCap = nextTurn > config.maxTurns;
  const collapse = anyStatZero && nextTurn > config.minTurnsBeforeEnd;
  const aiEnded =
    turnResult.is_game_over && nextTurn > config.minTurnsBeforeEnd;
  const perfectVictory = Object.values(state.stats).every((v) => v >= 100);
  return hardCap || collapse || aiEnded || perfectVictory;
}
