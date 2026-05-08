import type {
  GameState,
  GameStats,
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  FactionData,
} from "@/types";
import { INITIAL_GAME_STATE, clampStat } from "@/types";

export type GameAction =
  | { type: "ENTER_SELECTION" }
  | { type: "SET_SCENARIO"; scenario: ScenarioData }
  | { type: "PROCESS_TURN"; result: TurnResult }
  | { type: "GAME_OVER"; analysis: EndGameAnalysis }
  | { type: "LOAD_SAVE"; state: GameState }
  | { type: "RESET" };

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
        description: update.description || result[idx].description,
        strength: update.strength || result[idx].strength,
        weakness: update.weakness || result[idx].weakness,
        needs: update.needs || result[idx].needs,
        attitude: update.attitude || result[idx].attitude,
      };
    } else if (update.is_new) {
      result.push({
        name: update.name,
        description: update.description,
        strength: update.strength,
        weakness: update.weakness,
        needs: update.needs,
        attitude: update.attitude,
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
      };
    }

    case "GAME_OVER":
      return {
        ...state,
        phase: "ended",
        endGameAnalysis: action.analysis,
      };

    case "LOAD_SAVE":
      return { ...action.state };

    case "RESET":
      return { ...INITIAL_GAME_STATE };

    default:
      return state;
  }
}
