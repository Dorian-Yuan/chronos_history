import type {
  GameState,
  GameStats,
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  FactionData,
  CounselSession,
  CourtDebateMessage,
  CourtDebateSession,
} from "@/types";
import { INITIAL_GAME_STATE, clampStat } from "@/types";

export type GameAction =
  | { type: "ENTER_SELECTION" }
  | { type: "SET_SCENARIO"; scenario: ScenarioData }
  | { type: "PROCESS_TURN"; result: TurnResult }
  | { type: "GAME_OVER"; analysis: EndGameAnalysis }
  | { type: "LOAD_SAVE"; state: GameState }
  | { type: "RESET" }
  | { type: "UPDATE_COUNSEL_SESSION"; session: CounselSession }
  | {
      type: "START_COURT_DEBATE";
      topic: string;
      totalRounds: number;
      turnNumber: number;
    }
  | { type: "ADD_COURT_DEBATE_MESSAGE"; message: CourtDebateMessage }
  | { type: "ADVANCE_COURT_DEBATE_ROUND" }
  | { type: "FINISH_COURT_DEBATE" }
  | { type: "CLEAR_COURT_DEBATE" };

function applyStatsDelta(
  stats: GameStats,
  delta: TurnResult["stats_delta"],
): GameStats {
  return {
    stability: clampStat(stats.stability + delta.stability),
    economy: clampStat(stats.economy + delta.economy),
    military: clampStat(stats.military + delta.military),
    international_standing: clampStat(
      stats.international_standing + delta.international_standing,
    ),
  };
}

function updateFactions(
  currentFactions: FactionData[],
  updates: TurnResult["factions_update"],
): FactionData[] {
  const result = currentFactions.map((f) => ({ ...f }));

  for (const update of updates) {
    if (update.is_destroyed) {
      const idx = result.findIndex((f) => f.name === update.name);
      if (idx >= 0) {
        result[idx] = {
          ...result[idx],
          is_destroyed: true,
          attitude: "已灭亡",
        };
      }
      continue;
    }

    const idx = result.findIndex((f) => f.name === update.name);
    if (idx >= 0) {
      result[idx] = {
        ...result[idx],
        description: update.description ?? result[idx].description,
        strength: update.strength ?? result[idx].strength,
        weakness: update.weakness ?? result[idx].weakness,
        needs: update.needs ?? result[idx].needs,
        attitude: update.attitude ?? result[idx].attitude,
        leader: update.leader ?? result[idx].leader,
        is_new: false,
      };
    } else if (update.is_new) {
      result.push({
        name: update.name,
        description: update.description,
        strength: update.strength,
        weakness: update.weakness,
        needs: update.needs,
        attitude: update.attitude,
        leader: update.leader,
        is_new: true,
      });
    }
  }

  return result;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ENTER_SELECTION":
      return { ...state, phase: "selection" };

    case "SET_SCENARIO": {
      const scenario = action.scenario;
      return {
        ...state,
        phase: "playing",
        scenario,
        stats: { ...scenario.initial_stats },
        turnCount: 1,
        historyLog: [],
        currentTurnResult: null,
        endGameAnalysis: null,
        turnResults: [],
        counselSessions: [],
      };
    }

    case "PROCESS_TURN": {
      const result = action.result;
      const newStats = applyStatsDelta(state.stats, result.stats_delta);
      const newScenario = state.scenario
        ? {
            ...state.scenario,
            factions: updateFactions(
              state.scenario.factions,
              result.factions_update,
            ),
          }
        : null;

      return {
        ...state,
        stats: newStats,
        turnCount: state.turnCount + 1,
        historyLog: [...state.historyLog, result.hidden_consequences],
        currentTurnResult: result,
        scenario: newScenario,
        turnResults: [...state.turnResults, result],
        counselSessions: [],
      };
    }

    case "GAME_OVER":
      return {
        ...state,
        phase: "ended",
        endGameAnalysis: action.analysis,
      };

    case "LOAD_SAVE": {
      const loaded = action.state;
      const courtDebateSessions =
        loaded.courtDebateSessions ??
        ((loaded as unknown as Record<string, unknown>).courtDebate
          ? [
              (loaded as unknown as Record<string, unknown>)
                .courtDebate as CourtDebateSession,
            ]
          : []);
      return {
        ...loaded,
        turnResults: loaded.turnResults ?? [],
        counselSessions: loaded.counselSessions ?? [],
        courtDebateSessions,
      };
    }

    case "RESET":
      return { ...INITIAL_GAME_STATE };

    case "UPDATE_COUNSEL_SESSION": {
      const existing = state.counselSessions.findIndex(
        (s) => s.advisorRole === action.session.advisorRole,
      );
      const sessions = [...state.counselSessions];
      if (existing >= 0) {
        sessions[existing] = action.session;
      } else {
        sessions.push(action.session);
      }
      return {
        ...state,
        counselSessions: sessions,
      };
    }

    case "START_COURT_DEBATE": {
      const session: CourtDebateSession = {
        topic: action.topic,
        totalRounds: action.totalRounds,
        currentRound: 0,
        messages: [],
        isFinished: false,
        turnNumber: action.turnNumber,
      };
      return {
        ...state,
        courtDebateSessions: [...state.courtDebateSessions, session],
      };
    }

    case "ADD_COURT_DEBATE_MESSAGE": {
      if (state.courtDebateSessions.length === 0) return state;
      const sessions = [...state.courtDebateSessions];
      const lastIdx = sessions.length - 1;
      sessions[lastIdx] = {
        ...sessions[lastIdx],
        messages: [...sessions[lastIdx].messages, action.message],
      };
      return {
        ...state,
        courtDebateSessions: sessions,
      };
    }

    case "ADVANCE_COURT_DEBATE_ROUND": {
      if (state.courtDebateSessions.length === 0) return state;
      const sessions = [...state.courtDebateSessions];
      const lastIdx = sessions.length - 1;
      sessions[lastIdx] = {
        ...sessions[lastIdx],
        currentRound: sessions[lastIdx].currentRound + 1,
      };
      return {
        ...state,
        courtDebateSessions: sessions,
      };
    }

    case "FINISH_COURT_DEBATE": {
      if (state.courtDebateSessions.length === 0) return state;
      const sessions = [...state.courtDebateSessions];
      const lastIdx = sessions.length - 1;
      sessions[lastIdx] = {
        ...sessions[lastIdx],
        isFinished: true,
      };
      return {
        ...state,
        courtDebateSessions: sessions,
      };
    }

    case "CLEAR_COURT_DEBATE":
      return {
        ...state,
        courtDebateSessions: [],
      };

    default:
      return state;
  }
}
