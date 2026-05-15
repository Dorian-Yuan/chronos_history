import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useGameState, useGameDispatch } from "@/lib/game";
import {
  evaluateTurn,
  analyzeGame,
  autoSave,
  addHistoryRecord,
  addToPersonaCompendium,
  addToHistoryCompendium,
} from "@/lib/game";
import {
  ChroniclePanel,
  CabinetPanel,
  IntelligencePanel,
  GameInput,
  SaveManager,
  CourtDebatePanel,
  EndGameConfirmModal,
  SandTablePanel,
} from "@/components/game";
import type {
  TurnResult,
  ScenarioData,
  FactionData,
  AdvisorData,
  GameUniverse,
} from "@/types";
import { determineConditionalOutcome, checkGameOver, clampStat } from "@/types";
import { getTerminology } from "@/config/terminology";
import {
  Settings,
  Save,
  BookOpen,
  Users,
  Radar,
  Home,
  Scale,
  Coins,
  Swords,
  Globe,
  Flag,
  Map as MapIcon,
} from "lucide-react";
import { useUIStore, useSettingsStore } from "@/stores";
import {
  generateSandTableMap,
  generateDeterministicSandTableMap,
  updateSandTable,
} from "@/lib/sand-table/sand-table-ai";

type SideTab = "cabinet" | "intelligence" | "courtDebate" | "sandTable";

function safeGetAdvisors(
  scenario: ScenarioData | null,
  turnResults: TurnResult[],
  currentAdvisors: AdvisorData[],
): AdvisorData[] {
  if (currentAdvisors.length > 0) {
    const roleMap = new Map<string, AdvisorData>();
    for (const a of currentAdvisors) {
      const existing = roleMap.get(a.role);
      if (!existing) {
        roleMap.set(a.role, a);
      } else if (a.status === "active" && existing.status !== "active") {
        roleMap.set(a.role, a);
      }
    }
    const result = Array.from(roleMap.values());
    if (result.length > 0) return result;
  }
  if (turnResults.length > 0) {
    const last = turnResults[turnResults.length - 1];
    if (Array.isArray(last?.advisors) && last.advisors.length > 0) {
      return last.advisors;
    }
  }
  return Array.isArray(scenario?.initial_advisors)
    ? scenario.initial_advisors
    : [];
}

function safeGetFactions(scenario: ScenarioData | null): FactionData[] {
  if (!scenario) return [];
  return Array.isArray(scenario.factions) ? scenario.factions : [];
}

function safeGetDelta(turnResults: TurnResult[]) {
  if (turnResults.length > 0) {
    return turnResults[turnResults.length - 1].stats_delta;
  }
  return undefined;
}

export function GamePage() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("cabinet");
  const [mobileTab, setMobileTab] = useState<
    "chronicle" | "cabinet" | "courtDebate" | "intelligence" | "sandTable"
  >("chronicle");
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  // showSandTable 在此处还未能计算（scenario 是后面才声明的），
  // 所以 isSandTableLoading 的初始值就用 false，effect 立即设置为 true
  const [isSandTableLoading, setIsSandTableLoading] = useState(false);
  const [sandTableError, setSandTableError] = useState<string | null>(null);
  const [sandTableRetryTrigger, setSandTableRetryTrigger] = useState(0);
  const sandTableScenarioIdRef = useRef<string | null>(null);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const experimentalMode = useSettingsStore((s) => s.experimentalMode);

  const universe: GameUniverse = state.universe || "history";
  const term = useMemo(() => getTerminology(universe), [universe]);

  const scenario = state.scenario;
  const turnResults = state.turnResults;

  const currentAdvisors = safeGetAdvisors(
    scenario,
    turnResults,
    state.currentAdvisors,
  );
  const currentFactions = safeGetFactions(scenario);
  const currentDelta = safeGetDelta(turnResults);

  const nationName =
    scenario?.player_context?.nation_name || term.defaultNationName;
  const leaderTitle =
    scenario?.player_context?.leader_title || term.defaultLeaderTitle;
  const scenarioTitle = scenario?.title || term.defaultScenarioTitle;

  const superiorInfo =
    universe === "life" && scenario?.player_context?.superior_title
      ? {
          title: scenario.player_context.superior_title,
          name: scenario.player_context.superior_name || "",
        }
      : undefined;
  const favorValue =
    universe === "life" ? state.stats.international_standing : undefined;

  const showSandTable =
    experimentalMode &&
    universe === "history" &&
    (scenario?.play_style === "Conquest" ||
      scenario?.play_style === "Survival");

  // 派生 loading 状态：展示条件满足且尚无沙盘数据时就是 loading（不依赖 useEffect 的异步 setState）
  const sandTableIsActuallyLoading =
    showSandTable && (!state.sandTableState || isSandTableLoading);

  const TAB_CONFIG = useMemo(() => {
    const config: Record<
      string,
      {
        icon: typeof BookOpen;
        label: string;
        colorVar: string;
      }
    > = {
      chronicle: {
        icon: BookOpen,
        label: term.chronicleLabel,
        colorVar: "--color-tab-chronicle",
      },
      cabinet: {
        icon: Users,
        label: term.cabinetLabel,
        colorVar: "--color-tab-cabinet",
      },
      courtDebate: {
        icon: Scale,
        label: term.courtDebateLabel,
        colorVar: "--color-tab-court-debate",
      },
      intelligence: {
        icon: Radar,
        label: term.intelligenceLabel,
        colorVar: "--color-tab-intelligence",
      },
    };
    if (showSandTable) {
      config.sandTable = {
        icon: MapIcon,
        label:
          ((term as Record<string, unknown>).sandTableLabel as string) ||
          "沙盘",
        colorVar: "--color-tab-sand-table",
      };
    }
    return config;
  }, [term, showSandTable]);

  const STAT_CONFIG = useMemo(
    () => [
      {
        key: "stability" as const,
        label: term.statLabels.stability,
        Icon: Scale,
      },
      { key: "economy" as const, label: term.statLabels.economy, Icon: Coins },
      {
        key: "military" as const,
        label: term.statLabels.military,
        Icon: Swords,
      },
      {
        key: "international_standing" as const,
        label: term.statLabels.international_standing,
        Icon: Globe,
      },
    ],
    [term],
  );

  useEffect(() => {
    if (state.turnCount > 1 && scenario) {
      autoSave(state);
    }
  }, [state.turnCount, state.stats, scenario, state]);

  useEffect(() => {
    if (!showSandTable || !scenario) return;

    if (sandTableScenarioIdRef.current !== scenario.id) {
      console.log("[SandTable] 检测到新场景，重置跟踪:", scenario.title);
      sandTableScenarioIdRef.current = scenario.id;
    }

    if (state.sandTableState) {
      console.log("[SandTable] 沙盘数据已存在，跳过生成");
      return;
    }

    console.log(
      "[SandTable] useEffect触发，开始沙盘生成流程，showSandTable:",
      showSandTable,
      "scenario:",
      scenario.title,
    );

    let cancelled = false;
    setIsSandTableLoading(true);
    setSandTableError(null);

    const currentStats = state.stats;
    const currentTurnCount = state.turnCount;

    const attemptGenerate = async (retriesLeft: number): Promise<void> => {
      try {
        console.log(
          "[SandTable] 开始生成初始沙盘，场景:",
          scenario.title,
          "剩余重试:",
          retriesLeft,
        );
        const sandTableResult = await generateSandTableMap(
          scenario,
          currentStats,
        );
        if (cancelled) {
          console.log("[SandTable] 生成完成但已取消，跳过dispatch");
          return;
        }
        console.log(
          "[SandTable] AI生成成功，势力数:",
          sandTableResult.factions?.length,
          "区域数:",
          sandTableResult.regions?.length,
        );
        dispatch({
          type: "SET_SAND_TABLE",
          sandTableState: {
            factions: sandTableResult.factions,
            regions: sandTableResult.regions,
            mapWidth: 360,
            mapHeight: 480,
            lastUpdateTurn: currentTurnCount,
            seed: {
              seedX: Math.random() * Math.PI * 2,
              seedY: Math.random() * Math.PI * 2,
              seedZ: Math.random() * Math.PI * 2,
            },
          },
        });
        setSandTableError(null);
      } catch (e) {
        if (cancelled) {
          console.log("[SandTable] 生成失败但已取消，跳过处理");
          return;
        }
        console.error("[SandTable] AI生成失败，剩余重试:", retriesLeft, e);
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          return attemptGenerate(retriesLeft - 1);
        }
        console.error("[SandTable] AI全部失败，使用确定性降级生成");
        try {
          const fallbackResult = generateDeterministicSandTableMap(
            scenario,
            currentStats,
          );
          if (!cancelled) {
            console.log(
              "[SandTable] 降级生成成功，势力数:",
              fallbackResult.factions?.length,
            );
            dispatch({
              type: "SET_SAND_TABLE",
              sandTableState: fallbackResult,
            });
            setSandTableError("fallback");
          }
        } catch (fallbackErr) {
          console.error("[SandTable] 降级生成也失败:", fallbackErr);
          if (!cancelled) setSandTableError("failed");
        }
      }
    };

    attemptGenerate(1).finally(() => {
      console.log(
        "[SandTable] attemptGenerate完成，清除loading状态，cancelled:",
        cancelled,
      );
      setIsSandTableLoading(false);
    });

    return () => {
      console.log("[SandTable] useEffect cleanup，设置cancelled=true");
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showSandTable,
    scenario?.id,
    state.sandTableState,
    sandTableRetryTrigger,
  ]);

  const handleSandTableRetry = useCallback(() => {
    setSandTableError(null);
    setSandTableRetryTrigger((v) => v + 1);
  }, []);

  useEffect(() => {
    if (state.sandTableState && (sandTableError || isSandTableLoading)) {
      setSandTableError(null);
      setIsSandTableLoading(false);
    }
  }, [state.sandTableState, sandTableError, isSandTableLoading]);

  const handleSubmit = useCallback(
    async (action: string) => {
      if (isLoading || !scenario) return;
      setIsLoading(true);
      setError(null);

      try {
        const lastDateDisplay =
          turnResults.length > 0
            ? turnResults[turnResults.length - 1].date_display
            : undefined;

        const recentActions = state.playerActions.slice(-3);

        const currentSituation =
          turnResults.length > 0
            ? turnResults[turnResults.length - 1].situation_update
            : undefined;

        const recentSituations = turnResults
          .slice(-3)
          .map((r) => r.situation_update);

        const result = await evaluateTurn(
          scenario,
          state.historyLog,
          action,
          state.stats,
          state.turnCount,
          currentAdvisors,
          lastDateDisplay,
          recentActions,
          state.identityChangeCount,
          universe,
          currentSituation,
          recentSituations.length > 0 ? recentSituations : undefined,
        );

        dispatch({ type: "PROCESS_TURN", result, playerAction: action });

        if (
          showSandTable &&
          state.sandTableState &&
          !checkGameOver(state, result)
        ) {
          setIsSandTableLoading(true);
          try {
            const sandTableUpdate = await updateSandTable(
              scenario,
              currentFactions,
              state.sandTableState.factions.map((f) => ({
                name: f.name,
                power: f.power,
                dead: f.dead,
                isPlayer: f.isPlayer,
                direction: f.direction,
                nodes: f.nodes,
              })),
              result.stats_delta,
              {
                stability: clampStat(
                  state.stats.stability + result.stats_delta.stability,
                ),
                economy: clampStat(
                  state.stats.economy + result.stats_delta.economy,
                ),
                military: clampStat(
                  state.stats.military + result.stats_delta.military,
                ),
                international_standing: clampStat(
                  state.stats.international_standing +
                    result.stats_delta.international_standing,
                ),
              },
              action,
              state.turnCount + 1,
              result.factions_update
                ?.filter((fu) => fu.is_destroyed)
                .map((fu) => ({
                  name: fu.name,
                  conquered_by: undefined,
                })),
              result.factions_update
                ?.filter((fu) => fu.is_new)
                .map((fu) => ({
                  name: fu.name,
                  direction: fu.direction,
                })),
            );
            dispatch({
              type: "UPDATE_SAND_TABLE",
              factionUpdates: sandTableUpdate.factions,
            });
          } catch (e) {
            console.error("Sand table update failed:", e);
          } finally {
            setIsSandTableLoading(false);
          }
        }

        if (checkGameOver(state, result)) {
          try {
            const newStats = {
              stability: clampStat(
                state.stats.stability + result.stats_delta.stability,
              ),
              economy: clampStat(
                state.stats.economy + result.stats_delta.economy,
              ),
              military: clampStat(
                state.stats.military + result.stats_delta.military,
              ),
              international_standing: clampStat(
                state.stats.international_standing +
                  result.stats_delta.international_standing,
              ),
            };
            const newFactions = state.scenario
              ? [...state.scenario.factions]
              : [];
            const conditionalOutcome = determineConditionalOutcome({
              stats: newStats,
              playStyle: scenario.play_style,
              lifeMode: scenario.life_mode,
              factions: newFactions,
              turnCount: state.turnCount + 1,
              playerRank: scenario.player_context?.official_rank?.level,
            });

            const analysis = await analyzeGame(
              scenario,
              [...state.historyLog, result.hidden_consequences],
              conditionalOutcome,
              universe,
            );
            dispatch({ type: "GAME_OVER", analysis });

            const outcome = conditionalOutcome.base;

            addHistoryRecord({
              id: `history_${Date.now()}`,
              scenarioTitle: scenario.title,
              nationName: scenario.player_context.nation_name,
              leaderTitle: scenario.player_context.leader_title,
              turnCount: state.turnCount + 1,
              outcome,
              realEventTitle: scenario.hidden_real_event,
              personaTitle: analysis.persona_title,
              timestamp: Date.now(),
            });

            addToPersonaCompendium(
              analysis.persona_title,
              analysis.persona_description,
            );
            addToHistoryCompendium(
              scenario.hidden_real_event,
              analysis.real_outcome_summary,
            );
          } catch (e) {
            console.error("Failed to generate game analysis:", e);
          }
        }
      } catch (e) {
        console.error("Turn evaluation failed:", e);
        const msg = e instanceof Error ? e.message : term.evaluateError;
        if (
          msg.includes("JSON") ||
          msg.includes("json") ||
          msg.includes("Unrecognized token")
        ) {
          setError(term.jsonParseError);
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      scenario,
      state,
      currentAdvisors,
      currentFactions,
      turnResults,
      dispatch,
      universe,
      term,
      showSandTable,
    ],
  );

  const handleEndGame = useCallback(async () => {
    if (!scenario || state.phase !== "playing" || isLoading) return;
    setShowEndGameConfirm(false);
    setIsLoading(true);
    setError(null);
    try {
      const conditionalOutcome = determineConditionalOutcome({
        stats: state.stats,
        playStyle: scenario.play_style,
        lifeMode: scenario.life_mode,
        factions: scenario.factions,
        turnCount: state.turnCount,
        playerRank: scenario.player_context?.official_rank?.level,
      });

      const analysis = await analyzeGame(
        scenario,
        state.historyLog,
        conditionalOutcome,
        universe,
      );
      dispatch({ type: "GAME_OVER", analysis });

      const outcome = conditionalOutcome.base;
      addHistoryRecord({
        id: `history_${Date.now()}`,
        scenarioTitle: scenario.title,
        nationName: scenario.player_context.nation_name,
        leaderTitle: scenario.player_context.leader_title,
        turnCount: state.turnCount,
        outcome,
        realEventTitle: scenario.hidden_real_event,
        personaTitle: analysis.persona_title,
        timestamp: Date.now(),
      });

      addToPersonaCompendium(
        analysis.persona_title,
        analysis.persona_description,
      );
      addToHistoryCompendium(
        scenario.hidden_real_event,
        analysis.real_outcome_summary,
      );
    } catch (e) {
      console.error("Failed to end game:", e);
      const msg = e instanceof Error ? e.message : term.endGameError;
      setError(msg);
    } finally {
      setIsLoading(false);
      setShowEndGameConfirm(false);
    }
  }, [scenario, state, dispatch, universe, term, isLoading]);

  if (!scenario) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-text-tertiary" role="status">
          {term.loadingLabel}
        </p>
      </main>
    );
  }

  const renderTabButton = (
    tabKey: keyof typeof TAB_CONFIG,
    onClick: () => void,
    isActive: boolean,
    indicatorPosition: "top" | "bottom" = "bottom",
  ) => {
    const config = TAB_CONFIG[tabKey];
    const Icon = config.icon;
    const activeColor = `var(${config.colorVar})`;
    return (
      <button
        onClick={onClick}
        role="tab"
        aria-selected={isActive}
        className="flex flex-col items-center justify-center gap-1 flex-1 py-2 relative transition-colors"
      >
        <Icon
          size={18}
          className={isActive ? "" : "text-text-tertiary"}
          style={isActive ? { color: activeColor } : undefined}
        />
        <span
          className={`text-xs font-semibold ${isActive ? "" : "text-text-tertiary"}`}
          style={isActive ? { color: activeColor } : undefined}
        >
          {config.label}
        </span>
        {isActive && (
          <div
            className={`absolute ${indicatorPosition === "top" ? "top-0" : "bottom-0"} h-[2px] w-8 rounded-full`}
            style={{ backgroundColor: activeColor }}
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        className="mt-4"
        style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
      >
        <div className="rounded-lg border border-border bg-bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
              <span className="text-base font-serif font-bold text-text-primary truncate">
                {nationName}
              </span>
              <span className="text-xs font-serif text-accent-primary opacity-80 truncate">
                // {leaderTitle}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0 pl-3 border-l border-border/50">
              <button
                onClick={() => dispatch({ type: "RESET" })}
                className="flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-all w-7 h-7"
                aria-label={term.backButton}
              >
                <Home size={16} strokeWidth={1.5} />
              </button>
              {state.phase === "playing" && (
                <button
                  onClick={() => setShowEndGameConfirm(true)}
                  disabled={isLoading || state.turnCount < 8}
                  title={
                    state.turnCount < 8 ? term.endGameLockedHint : undefined
                  }
                  className="flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-accent-primary transition-all w-7 h-7 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={term.endGameTitle}
                >
                  <Flag size={16} strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => setShowSaveManager(true)}
                className="flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-all w-7 h-7"
                aria-label={term.saveButton}
              >
                <Save size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center justify-center rounded-md text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-all w-7 h-7"
                aria-label={term.settingsLabel}
              >
                <Settings size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div className="h-px bg-border mx-4" />
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3"
            role="group"
            aria-label={term.statAriaLabel}
          >
            {STAT_CONFIG.map(({ key, label, Icon }) => {
              const value = state.stats[key];
              const deltaValue = currentDelta?.[key] ?? 0;
              const barColor =
                value >= 70
                  ? "var(--color-accent-primary)"
                  : "var(--color-accent-secondary)";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                      <Icon size={10} className="text-text-tertiary" />
                      {label}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {value}
                      </span>
                      {deltaValue !== 0 && (
                        <span
                          className={`font-mono text-xs font-medium ${deltaValue > 0 ? "text-accent-primary" : "text-accent-danger"}`}
                        >
                          {deltaValue > 0 ? `+${deltaValue}` : deltaValue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="h-1 w-full overflow-hidden rounded-sm bg-bg-tertiary"
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label}: ${value}`}
                  >
                    <div
                      className="h-full rounded-sm transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`flex-1 flex-col overflow-hidden md:flex gap-2 ${mobileTab !== "chronicle" ? "hidden" : "flex"}`}
          >
            {error && (
              <div className="mx-5 mt-3 rounded-lg border border-status-error-border bg-status-error-bg px-4 py-2.5 text-xs text-status-error-text flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-status-error-text/60 hover:text-status-error-text"
                >
                  ✕
                </button>
              </div>
            )}
            <ChroniclePanel
              scenario={scenario}
              turnCount={state.turnCount}
              turnResults={turnResults}
              isLoading={isLoading}
              universe={universe}
            />
            <GameInput
              onSubmit={handleSubmit}
              disabled={isLoading || state.phase === "ended"}
              placeholder={term.inputPlaceholder}
              decisionOptions={
                state.turnResults.length > 0
                  ? state.turnResults[state.turnResults.length - 1]
                      .decision_options || []
                  : scenario?.initial_decision_options || []
              }
              universe={universe}
            />
          </div>

          <div
            className={`flex-1 flex-col overflow-y-auto md:hidden ${mobileTab === "chronicle" ? "hidden" : "flex"}`}
          >
            <div className={mobileTab === "cabinet" ? "contents" : "hidden"}>
              <CabinetPanel
                advisors={currentAdvisors}
                scenario={scenario}
                stats={state.stats}
                historyLog={state.historyLog}
                currentSituation={
                  turnResults.length > 0
                    ? turnResults[turnResults.length - 1].situation_update
                    : ""
                }
                universe={universe}
              />
            </div>
            <div
              className={mobileTab === "courtDebate" ? "contents" : "hidden"}
            >
              <CourtDebatePanel
                scenario={scenario}
                stats={state.stats}
                historyLog={state.historyLog}
                currentSituation={
                  turnResults.length > 0
                    ? turnResults[turnResults.length - 1].situation_update
                    : ""
                }
                turnCount={state.turnCount}
                turnResults={turnResults}
                advisors={currentAdvisors}
                courtDebateSessions={state.courtDebateSessions}
                universe={universe}
                visible={mobileTab === "courtDebate"}
              />
            </div>
            {showSandTable && (
              <div
                className={mobileTab === "sandTable" ? "contents" : "hidden"}
              >
                <SandTablePanel
                  sandTableState={state.sandTableState}
                  isLoading={sandTableIsActuallyLoading}
                  universe={universe}
                  error={sandTableError}
                  onRetry={handleSandTableRetry}
                />
              </div>
            )}
            <div
              className={
                mobileTab !== "cabinet" &&
                mobileTab !== "courtDebate" &&
                mobileTab !== "sandTable"
                  ? "contents"
                  : "hidden"
              }
            >
              <IntelligencePanel
                factions={currentFactions}
                universe={universe}
                superior={superiorInfo}
                favor={favorValue}
              />
            </div>
          </div>
        </div>

        <div className="hidden md:flex w-80 shrink-0 flex-col border-l border-border bg-bg-secondary">
          <div
            className="flex border-b border-border"
            role="tablist"
            aria-label={term.sidebarAriaLabel}
          >
            {renderTabButton(
              "cabinet",
              () => setSideTab("cabinet"),
              sideTab === "cabinet",
              "bottom",
            )}
            {renderTabButton(
              "courtDebate",
              () => setSideTab("courtDebate"),
              sideTab === "courtDebate",
              "bottom",
            )}
            {renderTabButton(
              "intelligence",
              () => setSideTab("intelligence"),
              sideTab === "intelligence",
              "bottom",
            )}
            {showSandTable &&
              renderTabButton(
                "sandTable",
                () => setSideTab("sandTable"),
                sideTab === "sandTable",
                "bottom",
              )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div
              id="panel-cabinet"
              role="tabpanel"
              className={sideTab === "cabinet" ? "" : "hidden"}
            >
              <CabinetPanel
                advisors={currentAdvisors}
                scenario={scenario}
                stats={state.stats}
                historyLog={state.historyLog}
                currentSituation={
                  turnResults.length > 0
                    ? turnResults[turnResults.length - 1].situation_update
                    : ""
                }
                universe={universe}
              />
            </div>
            <div
              id="panel-court-debate"
              role="tabpanel"
              className={sideTab === "courtDebate" ? "" : "hidden"}
            >
              <CourtDebatePanel
                scenario={scenario}
                stats={state.stats}
                historyLog={state.historyLog}
                currentSituation={
                  turnResults.length > 0
                    ? turnResults[turnResults.length - 1].situation_update
                    : ""
                }
                turnCount={state.turnCount}
                turnResults={turnResults}
                advisors={currentAdvisors}
                courtDebateSessions={state.courtDebateSessions}
                universe={universe}
                visible={sideTab === "courtDebate"}
              />
            </div>
            <div
              id="panel-intelligence"
              role="tabpanel"
              className={sideTab === "intelligence" ? "" : "hidden"}
            >
              <IntelligencePanel
                factions={currentFactions}
                universe={universe}
                superior={superiorInfo}
                favor={favorValue}
              />
            </div>
            {showSandTable && (
              <div
                id="panel-sand-table"
                role="tabpanel"
                className={sideTab === "sandTable" ? "" : "hidden"}
              >
                <SandTablePanel
                  sandTableState={state.sandTableState}
                  isLoading={sandTableIsActuallyLoading}
                  universe={universe}
                  error={sandTableError}
                  onRetry={handleSandTableRetry}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <nav
        className="flex md:hidden border-t border-border pb-[env(safe-area-inset-bottom,0px)]"
        style={{
          background: "var(--color-glass-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
        aria-label={term.gamePanelAriaLabel}
      >
        {renderTabButton(
          "chronicle",
          () => setMobileTab("chronicle"),
          mobileTab === "chronicle",
          "top",
        )}
        {renderTabButton(
          "cabinet",
          () => setMobileTab("cabinet"),
          mobileTab === "cabinet",
          "top",
        )}
        {renderTabButton(
          "courtDebate",
          () => setMobileTab("courtDebate"),
          mobileTab === "courtDebate",
          "top",
        )}
        {renderTabButton(
          "intelligence",
          () => setMobileTab("intelligence"),
          mobileTab === "intelligence",
          "top",
        )}
        {showSandTable &&
          renderTabButton(
            "sandTable",
            () => setMobileTab("sandTable"),
            mobileTab === "sandTable",
            "top",
          )}
      </nav>

      <footer className="hidden md:flex items-center justify-between h-10 px-6 border-t border-border bg-bg-secondary text-xs text-text-tertiary">
        <span className="font-mono">
          {term.turnLabel}: {state.turnCount}
        </span>
        <span className="font-serif">{scenarioTitle}</span>
        <button
          onClick={() => setShowSaveManager(true)}
          className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Save size={12} />
          {term.saveButton}
        </button>
      </footer>

      {showSaveManager && (
        <SaveManager
          mode="game"
          gameState={state}
          onLoad={(gameState) => {
            dispatch({ type: "LOAD_SAVE", state: gameState });
            setShowSaveManager(false);
          }}
          onClose={() => setShowSaveManager(false)}
        />
      )}

      {showEndGameConfirm && (
        <EndGameConfirmModal
          turnCount={state.turnCount}
          onConfirm={handleEndGame}
          onCancel={() => setShowEndGameConfirm(false)}
          universe={universe}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
