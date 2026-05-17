import type {
  GameState,
  GameStats,
  GameUniverse,
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  FactionData,
  AdvisorData,
  CounselSession,
  CourtDebateMessage,
  CourtDebateSession,
  SandTableState,
  SandTableFactionUpdate,
  SandTableFaction,
} from "@/types";
import { INITIAL_GAME_STATE, clampStat } from "@/types";
import { getAppConfig } from "@/config";
import { normalizeAttitude } from "./utils";
import { assignFactionColors } from "@/lib/sand-table/engine";

export type GameAction =
  | { type: "ENTER_SELECTION" }
  | { type: "ENTER_LIFE_SELECTION" }
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
  | { type: "CLEAR_COURT_DEBATE" }
  | { type: "SET_SAND_TABLE"; sandTableState: SandTableState }
  | { type: "UPDATE_SAND_TABLE"; factionUpdates: SandTableFactionUpdate[] };

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

function updateAdvisors(
  currentAdvisors: AdvisorData[],
  newAdvisors: AdvisorData[],
): { advisors: AdvisorData[]; pendingAdvisors: AdvisorData[] } {
  const result: AdvisorData[] = [];
  const pending: AdvisorData[] = [];
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
      pending.push({
        ...newAdvisor,
        status: "active",
      });
    } else {
      result.push({
        ...newAdvisor,
        status: "active",
      });
    }
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

  return { advisors: result, pendingAdvisors: pending };
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
        is_external: update.is_external ?? result[idx].is_external,
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
        is_external: update.is_external,
        is_new: true,
      });
    }
  }

  return result;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ENTER_SELECTION":
      return {
        ...state,
        phase: "selection",
        universe: "history" as GameUniverse,
      };

    case "ENTER_LIFE_SELECTION":
      return {
        ...state,
        phase: "life_selection",
        universe: "life" as GameUniverse,
      };

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
        courtDebateSessions: [],
        playerActions: [],
        currentAdvisors: initialAdvisors,
        pendingAdvisors: [],
        identityChangeCount: { nation_name: 0, leader_title: 0 },
        sandTableState: null,
      };
    }

    case "PROCESS_TURN": {
      const result = action.result;

      let baseAdvisors = [...state.currentAdvisors];
      if (state.pendingAdvisors.length > 0) {
        for (const pending of state.pendingAdvisors) {
          baseAdvisors = baseAdvisors.filter(
            (a) => !(a.role === pending.role && a.status !== "active"),
          );
          baseAdvisors.push(pending);
        }
      }

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

      const { advisors: updatedAdvisors, pendingAdvisors } = updateAdvisors(
        baseAdvisors,
        result.advisors,
      );

      const playerContextUpdate = result.player_context_update;
      const newIdentityChangeCount = { ...state.identityChangeCount };
      let updatedPlayerContext = state.scenario?.player_context;

      if (playerContextUpdate && state.scenario) {
        const hasActualChange =
          playerContextUpdate.nation_name ||
          playerContextUpdate.leader_title ||
          playerContextUpdate.official_rank ||
          playerContextUpdate.superior_name;

        if (!hasActualChange) {
          result.player_context_update = undefined;
          if (playerContextUpdate.change_reason) {
            result.narrative = result.narrative
              ? `${result.narrative}\n\n【${playerContextUpdate.change_reason}】`
              : playerContextUpdate.change_reason;
          }
        } else {
          const oldContext = state.scenario.player_context;
          playerContextUpdate.previous_nation_name = oldContext.nation_name;
          playerContextUpdate.previous_leader_title = oldContext.leader_title;
          if (oldContext.official_rank) {
            playerContextUpdate.previous_official_rank = {
              ...oldContext.official_rank,
            };
          }
          if (oldContext.superior_title) {
            playerContextUpdate.previous_superior_title =
              oldContext.superior_title;
          }
          if (oldContext.superior_name) {
            playerContextUpdate.previous_superior_name =
              oldContext.superior_name;
          }

          updatedPlayerContext = {
            ...state.scenario.player_context,
            ...(playerContextUpdate.nation_name && {
              nation_name: playerContextUpdate.nation_name,
            }),
            ...(playerContextUpdate.leader_title && {
              leader_title: playerContextUpdate.leader_title,
            }),
            ...(playerContextUpdate.background_summary && {
              background_summary: playerContextUpdate.background_summary,
            }),
            ...(playerContextUpdate.official_rank && {
              official_rank: playerContextUpdate.official_rank,
            }),
            ...(playerContextUpdate.superior_title && {
              superior_title: playerContextUpdate.superior_title,
            }),
            ...(playerContextUpdate.superior_name && {
              superior_name: playerContextUpdate.superior_name,
            }),
            ...(playerContextUpdate.leader_label && {
              leader_label: playerContextUpdate.leader_label,
            }),
            ...(playerContextUpdate.court_term && {
              court_term: playerContextUpdate.court_term,
            }),
            ...(playerContextUpdate.ministers_term && {
              ministers_term: playerContextUpdate.ministers_term,
            }),
          };
          if (playerContextUpdate.nation_name)
            newIdentityChangeCount.nation_name++;
          if (playerContextUpdate.leader_title)
            newIdentityChangeCount.leader_title++;
        }
      }

      const finalScenario = newScenario
        ? updatedPlayerContext
          ? { ...newScenario, player_context: updatedPlayerContext }
          : newScenario
        : null;

      return {
        ...state,
        stats: newStats,
        turnCount: state.turnCount + 1,
        historyLog: [...state.historyLog, result.hidden_consequences],
        currentTurnResult: result,
        scenario: finalScenario,
        turnResults: [...state.turnResults, result],
        counselSessions: [],
        playerActions: [...state.playerActions, action.playerAction],
        currentAdvisors: updatedAdvisors,
        pendingAdvisors,
        identityChangeCount: newIdentityChangeCount,
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
        pendingAdvisors: (loaded as GameState).pendingAdvisors ?? [],
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

    case "SET_SAND_TABLE":
      return {
        ...state,
        sandTableState: action.sandTableState,
      };

    case "UPDATE_SAND_TABLE": {
      if (!state.sandTableState) return state;
      let updatedFactions = [...state.sandTableState.factions];

      updatedFactions = updatedFactions.map((f) => {
        const update = action.factionUpdates.find((u) => u.name === f.name);
        if (!update || f.dead) return f;
        let newTarget = f.targetPower + update.power_delta;
        if (newTarget < 0.1) newTarget = 0.1;
        if (newTarget > 6.0) newTarget = 6.0;
        return { ...f, targetPower: newTarget };
      });

      for (const update of action.factionUpdates) {
        if (update.conquered_by) {
          const conqueredIdx = updatedFactions.findIndex(
            (f) => f.name === update.name && !f.dead,
          );
          const conquerorIdx = updatedFactions.findIndex(
            (f) => f.name === update.conquered_by && !f.dead,
          );
          if (conqueredIdx >= 0 && conquerorIdx >= 0) {
            const conquered = updatedFactions[conqueredIdx];
            const conqueror = updatedFactions[conquerorIdx];
            updatedFactions[conquerorIdx] = {
              ...conqueror,
              nodes: [...conqueror.nodes, ...conquered.nodes],
              targetPower: Math.min(
                conqueror.targetPower + conquered.power * 0.5,
                6.0,
              ),
            };
            updatedFactions[conqueredIdx] = {
              ...conquered,
              dead: true,
              targetPower: 0.1,
              power: 0.1,
            };
          }
        }
      }

      for (const update of action.factionUpdates) {
        if (update.is_new_faction && update.nodes && update.nodes.length > 0) {
          const exists = updatedFactions.some((f) => f.name === update.name);
          if (!exists) {
            const newFaction: SandTableFaction = {
              id: `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: update.name,
              nodes: update.nodes,
              power: Math.max(0.1, update.power_delta),
              targetPower: Math.max(0.1, update.power_delta),
              rgb: [0, 0, 0],
              isPlayer: false,
              dead: false,
              direction: update.direction || "北",
            };
            updatedFactions = assignFactionColors(
              updatedFactions.concat(newFaction),
            );
          }
        }
      }

      return {
        ...state,
        sandTableState: {
          ...state.sandTableState,
          factions: updatedFactions,
          lastUpdateTurn: state.turnCount,
        },
      };
    }

    default:
      return state;
  }
}
