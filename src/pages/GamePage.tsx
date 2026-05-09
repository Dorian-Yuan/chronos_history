import { useState, useCallback, useEffect } from "react";
import { useGameState, useGameDispatch } from "@/lib/game";
import {
  evaluateTurn,
  analyzeGame,
  autoSave,
  addHistoryRecord,
} from "@/lib/game";
import {
  ChroniclePanel,
  CabinetPanel,
  IntelligencePanel,
  StatBars,
  GameInput,
  SaveManager,
} from "@/components/game";
import type { TurnResult, ScenarioData, FactionData } from "@/types";
import { determineOutcome, checkGameOver, clampStat } from "@/types";
import { Settings, Save } from "lucide-react";
import { useUIStore } from "@/stores";

type SideTab = "cabinet" | "intelligence";

function safeGetAdvisors(
  scenario: ScenarioData | null,
  turnResults: TurnResult[],
) {
  if (!scenario) return [];
  if (turnResults.length > 0) {
    const last = turnResults[turnResults.length - 1];
    if (Array.isArray(last?.advisors) && last.advisors.length > 0) {
      return last.advisors;
    }
  }
  return Array.isArray(scenario.initial_advisors)
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
  const [mobileTab, setMobileTab] = useState<"chronicle" | SideTab>(
    "chronicle",
  );
  const [showSaveManager, setShowSaveManager] = useState(false);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const scenario = state.scenario;
  const turnResults = state.turnResults;

  const currentAdvisors = safeGetAdvisors(scenario, turnResults);
  const currentFactions = safeGetFactions(scenario);
  const currentDelta = safeGetDelta(turnResults);

  const nationName = scenario?.player_context?.nation_name || "未知国家";
  const leaderTitle = scenario?.player_context?.leader_title || "统治者";
  const scenarioTitle = scenario?.title || "未知剧本";

  useEffect(() => {
    if (state.turnCount > 1 && scenario) {
      autoSave(state);
    }
  }, [state.turnCount, state.stats, scenario, state]);

  const handleSubmit = useCallback(
    async (action: string) => {
      if (isLoading || !scenario) return;
      setIsLoading(true);
      setError(null);

      try {
        const result = await evaluateTurn(
          scenario,
          state.historyLog,
          action,
          state.stats,
          state.turnCount,
        );

        dispatch({ type: "PROCESS_TURN", result });

        if (checkGameOver(state, result)) {
          try {
            const analysis = await analyzeGame(scenario, [
              ...state.historyLog,
              result.hidden_consequences,
            ]);
            dispatch({ type: "GAME_OVER", analysis });

            const outcome = determineOutcome({
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
            });

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
          } catch (e) {
            console.error("Failed to generate game analysis:", e);
          }
        }
      } catch (e) {
        console.error("Turn evaluation failed:", e);
        const msg = e instanceof Error ? e.message : "推演失败";
        if (
          msg.includes("JSON") ||
          msg.includes("json") ||
          msg.includes("Unrecognized token")
        ) {
          setError("AI 返回格式异常，请检查 API 配置或更换模型");
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, scenario, state, dispatch],
  );

  if (!scenario) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-text-tertiary" role="status">
          加载中...
        </p>
      </main>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 glass">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm font-medium text-text-primary">
            {scenarioTitle}
          </span>
          <span className="text-xs text-text-tertiary">
            {nationName} · 第{state.turnCount}回合
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveManager(true)}
            className="btn-ghost p-2"
            aria-label="存档管理"
          >
            <Save size={15} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="btn-ghost p-2"
            aria-label="设置"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      <StatBars stats={state.stats} delta={currentDelta} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`flex-1 flex flex-col overflow-hidden md:flex ${mobileTab !== "chronicle" ? "hidden md:flex" : "flex"}`}
          >
            {error && (
              <div className="mx-5 mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2.5 text-xs text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-red-400/60 hover:text-red-400"
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
            />
            <GameInput
              onSubmit={handleSubmit}
              disabled={isLoading || state.phase === "ended"}
              placeholder={`阁下，作为${leaderTitle}，您的决策是...`}
            />
          </div>

          <div
            className={`flex-1 flex flex-col overflow-hidden md:hidden ${mobileTab === "chronicle" ? "hidden" : "flex"}`}
          >
            {mobileTab === "cabinet" ? (
              <CabinetPanel advisors={currentAdvisors} />
            ) : (
              <IntelligencePanel factions={currentFactions} />
            )}
          </div>
        </div>

        <div className="hidden md:flex w-80 shrink-0 flex-col border-l border-border bg-bg-secondary/50">
          <div
            className="flex border-b border-border"
            role="tablist"
            aria-label="侧边栏"
          >
            <button
              onClick={() => setSideTab("cabinet")}
              role="tab"
              aria-selected={sideTab === "cabinet"}
              aria-controls="panel-cabinet"
              className={`flex-1 px-4 py-3.5 text-xs font-semibold tracking-wider transition-colors ${
                sideTab === "cabinet"
                  ? "text-accent-primary border-b-2 border-accent-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              内阁
            </button>
            <button
              onClick={() => setSideTab("intelligence")}
              role="tab"
              aria-selected={sideTab === "intelligence"}
              aria-controls="panel-intelligence"
              className={`flex-1 px-4 py-3.5 text-xs font-semibold tracking-wider transition-colors ${
                sideTab === "intelligence"
                  ? "text-accent-primary border-b-2 border-accent-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              情报
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div
              id="panel-cabinet"
              role="tabpanel"
              className={sideTab === "cabinet" ? "" : "hidden"}
            >
              <CabinetPanel advisors={currentAdvisors} />
            </div>
            <div
              id="panel-intelligence"
              role="tabpanel"
              className={sideTab === "intelligence" ? "" : "hidden"}
            >
              <IntelligencePanel factions={currentFactions} />
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex md:hidden border-t border-border glass"
        aria-label="游戏面板"
      >
        <button
          onClick={() => setMobileTab("chronicle")}
          className={`flex-1 px-4 py-3.5 text-xs font-semibold tracking-wider transition-colors ${
            mobileTab === "chronicle"
              ? "text-accent-primary border-t-2 border-accent-primary"
              : "text-text-tertiary"
          }`}
        >
          编年史
        </button>
        <button
          onClick={() => setMobileTab("cabinet")}
          className={`flex-1 px-4 py-3.5 text-xs font-semibold tracking-wider transition-colors ${
            mobileTab === "cabinet"
              ? "text-accent-primary border-t-2 border-accent-primary"
              : "text-text-tertiary"
          }`}
        >
          内阁
        </button>
        <button
          onClick={() => setMobileTab("intelligence")}
          className={`flex-1 px-4 py-3.5 text-xs font-semibold tracking-wider transition-colors ${
            mobileTab === "intelligence"
              ? "text-accent-primary border-t-2 border-accent-primary"
              : "text-text-tertiary"
          }`}
        >
          情报
        </button>
      </nav>

      {showSaveManager && (
        <SaveManager
          gameState={state}
          onLoad={(gameState) => {
            dispatch({ type: "LOAD_SAVE", state: gameState });
            setShowSaveManager(false);
          }}
          onClose={() => setShowSaveManager(false)}
        />
      )}
    </div>
  );
}
