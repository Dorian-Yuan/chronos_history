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

export interface CourtDebateMessage {
  role: "user" | "advisor";
  advisorRole?: AdvisorRole;
  advisorName?: string;
  content: string;
  stance?: "support" | "oppose" | "supplement";
}

export interface CourtDebateSession {
  topic: string;
  totalRounds: number;
  currentRound: number;
  messages: CourtDebateMessage[];
  isFinished: boolean;
  turnNumber: number;
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
  counselSessions: CounselSession[];
  courtDebateSessions: CourtDebateSession[];
  playerActions: string[];
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
  counselSessions: [],
  courtDebateSessions: [],
  playerActions: [],
};

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function determineOutcome(stats: GameStats): GameOutcome {
  const anyLow = Object.values(stats).some((v) => v <= 10);
  if (anyLow) return "defeat";
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
  const anyStatLow = Object.values(state.stats).some((v) => v <= 10);
  const hardCap = nextTurn > config.maxTurns;
  const collapse = anyStatLow && nextTurn > config.minTurnsBeforeEnd;
  const aiEnded =
    turnResult.is_game_over && nextTurn > config.minTurnsBeforeEnd;
  const perfectVictory = Object.values(state.stats).every((v) => v >= 95);
  return hardCap || collapse || aiEnded || perfectVictory;
}
