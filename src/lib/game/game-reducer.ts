import type {
  GameState,
  GameStats,
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  FactionData,
  AdvisorData,
  CounselSession,
  CourtDebateMessage,
  CourtDebateSession,
} from "@/types";
import { INITIAL_GAME_STATE, clampStat } from "@/types";
import { getAppConfig } from "@/config";

export type GameAction =
  | { type: "ENTER_SELECTION" }
  | { type: "SET_SCENARIO"; scenario: ScenarioData }
  | { type: "PROCESS_TURN"; result: TurnResult; playerAction: string }
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
  turnCount: number,
): GameStats {
  const config = getAppConfig();
  const protectionTurns = config.earlyGameProtectionTurns;

  const applyDelta = (current: number, change: number): number => {
    let result = current + change;
    if (turnCount <= Math.max(1, protectionTurns - 2)) {
      if (result < 15) result = Math.max(15, result);
    } else if (turnCount <= protectionTurns) {
      if (result < 10) result = Math.max(10, result);
    }
    return clampStat(result);
  };

  return {
    stability: applyDelta(stats.stability, delta.stability),
    economy: applyDelta(stats.economy, delta.economy),
    military: applyDelta(stats.military, delta.military),
    international_standing: applyDelta(
      stats.international_standing,
      delta.international_standing,
    ),
  };
}

const VALID_ATTITUDES = ["敌对", "求和", "中立", "友好", "臣服"];

const ATTITUDE_NORMALIZE_MAP: Record<string, string> = {
  即将归附: "友好",
  倾向臣服: "友好",
  即将臣服: "友好",
  表面臣服: "臣服",
  归附: "臣服",
  归顺: "臣服",
  降服: "臣服",
  倾向敌对: "敌对",
  敌视: "敌对",
  仇恨: "敌对",
  敌意: "敌对",
  亲近: "友好",
  友善: "友好",
  亲善: "友好",
  和平: "求和",
  议和: "求和",
  示好: "求和",
  冷淡: "中立",
  疏远: "中立",
  观望: "中立",
};

function normalizeAttitude(attitude: string): string {
  if (VALID_ATTITUDES.includes(attitude)) return attitude;
  if (ATTITUDE_NORMALIZE_MAP[attitude]) return ATTITUDE_NORMALIZE_MAP[attitude];
  for (const valid of VALID_ATTITUDES) {
    if (attitude.includes(valid)) return valid;
  }
  return "中立";
}

function updateAdvisors(
  currentAdvisors: AdvisorData[],
  newAdvisors: AdvisorData[],
): AdvisorData[] {
  const result: AdvisorData[] = [];
  const processedRoles = new Set<string>();

  for (const newAdvisor of newAdvisors) {
    const existing = currentAdvisors.find(
      (a) =>
        a.role === newAdvisor.role &&
        a.status !== "dead" &&
        a.status !== "exiled" &&
        a.status !== "retired",
    );
    if (existing && existing.name !== newAdvisor.name) {
      result.push({
        ...existing,
        status: newAdvisor.status || "retired",
      });
    }
    result.push({
      ...newAdvisor,
      status: "active",
    });
    processedRoles.add(newAdvisor.role);
  }

  for (const oldAdvisor of currentAdvisors) {
    if (
      !processedRoles.has(oldAdvisor.role) &&
      oldAdvisor.status === "active"
    ) {
      result.push({
        ...oldAdvisor,
        status: "retired",
      });
    }
  }

  return result;
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
          leader_status: update.leader_status || result[idx].leader_status,
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
        attitude: normalizeAttitude(update.attitude ?? result[idx].attitude),
        leader: update.leader ?? result[idx].leader,
        leader_status: update.leader_status || result[idx].leader_status,
        is_new: false,
      };
    } else if (update.is_new) {
      result.push({
        name: update.name,
        description: update.description,
        strength: update.strength,
        weakness: update.weakness,
        needs: update.needs,
        attitude: normalizeAttitude(update.attitude),
        leader: update.leader,
        leader_status: update.leader_status,
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
      const initialAdvisors = (scenario.initial_advisors || []).map((a) => ({
        ...a,
        status: "active" as const,
      }));
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
        playerActions: [],
        currentAdvisors: initialAdvisors,
      };
    }

    case "PROCESS_TURN": {
      const result = action.result;
      const newStats = applyStatsDelta(
        state.stats,
        result.stats_delta,
        state.turnCount,
      );
      const newScenario = state.scenario
        ? {
            ...state.scenario,
            factions: updateFactions(
              state.scenario.factions,
              result.factions_update,
            ),
          }
        : null;

      const updatedAdvisors = updateAdvisors(
        state.currentAdvisors,
        result.advisors,
      );

      return {
        ...state,
        stats: newStats,
        turnCount: state.turnCount + 1,
        historyLog: [...state.historyLog, result.hidden_consequences],
        currentTurnResult: result,
        scenario: newScenario,
        turnResults: [...state.turnResults, result],
        counselSessions: [],
        playerActions: [...state.playerActions, action.playerAction],
        currentAdvisors: updatedAdvisors,
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
      const loadedAdvisors = loaded.currentAdvisors ?? [];
      const hasActiveAdvisors = loadedAdvisors.some(
        (a) => a.status === "active" || !a.status,
      );
      return {
        ...loaded,
        turnResults: loaded.turnResults ?? [],
        counselSessions: loaded.counselSessions ?? [],
        courtDebateSessions,
        playerActions: loaded.playerActions ?? [],
        currentAdvisors: hasActiveAdvisors
          ? loadedAdvisors
          : (loaded.turnResults?.length > 0
              ? loaded.turnResults[loaded.turnResults.length - 1].advisors
              : (loaded.scenario?.initial_advisors ?? [])
            ).map((a) => ({ ...a, status: "active" as const })),
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
