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
import type { TurnResult } from "@/types";
import { determineOutcome, checkGameOver } from "@/types";
import { Settings, Save } from "lucide-react";
import { useUIStore } from "@/stores";

type SideTab = "cabinet" | "intelligence";

export function GamePage() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [turnResults, setTurnResults] = useState<TurnResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("cabinet");
  const [mobileTab, setMobileTab] = useState<"chronicle" | SideTab>(
    "chronicle",
  );
  const [showSaveManager, setShowSaveManager] = useState(false);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const scenario = state.scenario;

  const currentAdvisors =
    scenario && turnResults.length > 0
      ? turnResults[turnResults.length - 1].advisors
      : scenario?.initial_advisors || [];

  const currentDelta =
    turnResults.length > 0
      ? turnResults[turnResults.length - 1].stats_delta
      : undefined;

  useEffect(() => {
    if (state.turnCount > 1 && scenario) {
      autoSave(state);
    }
  }, [state.turnCount, state.stats, scenario, state]);

  const handleSubmit = useCallback(
    async (action: string) => {
      if (isLoading || !scenario) return;
      setIsLoading(true);

      try {
        const result = await evaluateTurn(
          scenario,
          state.historyLog,
          action,
          state.stats,
          state.turnCount,
        );

        setTurnResults((prev) => [...prev, result]);
        dispatch({ type: "PROCESS_TURN", result });

        if (checkGameOver(state, result)) {
          try {
            const updatedScenario = {
              ...scenario,
              factions: result.factions_update.reduce(
                (acc, update) => {
                  if (update.is_destroyed) {
                    return acc.map((f) =>
                      f.name === update.name
                        ? { ...f, is_destroyed: true, attitude: "已灭亡" }
                        : f,
                    );
                  }
                  const existing = acc.find((f) => f.name === update.name);
                  if (existing) {
                    return acc.map((f) =>
                      f.name === update.name ? { ...f, ...update } : f,
                    );
                  }
                  if (update.is_new) {
                    return [...acc, update];
                  }
                  return acc;
                },
                [...scenario.factions],
              ),
            };

            const analysis = await analyzeGame(updatedScenario, [
              ...state.historyLog,
              result.hidden_consequences,
            ]);
            dispatch({ type: "GAME_OVER", analysis });

            const outcome = determineOutcome({
              ...state.stats,
              stability: Math.max(
                0,
                Math.min(
                  100,
                  state.stats.stability + result.stats_delta.stability,
                ),
              ),
              economy: Math.max(
                0,
                Math.min(100, state.stats.economy + result.stats_delta.economy),
              ),
              military: Math.max(
                0,
                Math.min(
                  100,
                  state.stats.military + result.stats_delta.military,
                ),
              ),
              international_standing: Math.max(
                0,
                Math.min(
                  100,
                  state.stats.international_standing +
                    result.stats_delta.international_standing,
                ),
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
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, scenario, state, dispatch],
  );

  if (!scenario) {
    return (
      <main className="flex h-full items-center justify-center bg-zinc-950">
        <p className="text-zinc-500" role="status">
          加载中...
        </p>
      </main>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm font-medium text-zinc-300">
            {scenario.title}
          </span>
          <span className="text-xs text-zinc-500">
            {scenario.player_context.nation_name} · 第{state.turnCount}回合
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveManager(true)}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="存档管理"
          >
            <Save size={14} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="设置"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      <StatBars stats={state.stats} delta={currentDelta} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`flex-1 flex flex-col overflow-hidden md:flex ${mobileTab !== "chronicle" ? "hidden md:flex" : "flex"}`}
          >
            <ChroniclePanel
              scenario={scenario}
              turnCount={state.turnCount}
              turnResults={turnResults}
              isLoading={isLoading}
            />
            <GameInput
              onSubmit={handleSubmit}
              disabled={isLoading || state.phase === "ended"}
              placeholder={`阁下，作为${scenario.player_context.leader_title}，您的决策是...`}
            />
          </div>

          <div
            className={`flex-1 flex flex-col overflow-hidden md:hidden ${mobileTab === "chronicle" ? "hidden" : "flex"}`}
          >
            {mobileTab === "cabinet" ? (
              <CabinetPanel advisors={currentAdvisors} />
            ) : (
              <IntelligencePanel factions={scenario.factions} />
            )}
          </div>

          <div className="hidden md:flex w-72 flex-col border-l border-zinc-800">
            <div
              className="flex border-b border-zinc-800"
              role="tablist"
              aria-label="侧边栏"
            >
              <button
                onClick={() => setSideTab("cabinet")}
                role="tab"
                aria-selected={sideTab === "cabinet"}
                aria-controls="panel-cabinet"
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sideTab === "cabinet"
                    ? "text-amber-400 border-b-2 border-amber-500"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                内阁
              </button>
              <button
                onClick={() => setSideTab("intelligence")}
                role="tab"
                aria-selected={sideTab === "intelligence"}
                aria-controls="panel-intelligence"
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sideTab === "intelligence"
                    ? "text-amber-400 border-b-2 border-amber-500"
                    : "text-zinc-400 hover:text-zinc-200"
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
                <IntelligencePanel factions={scenario.factions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex md:hidden border-t border-zinc-800"
        aria-label="游戏面板"
      >
        <button
          onClick={() => setMobileTab("chronicle")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mobileTab === "chronicle"
              ? "text-amber-400 border-t-2 border-amber-500"
              : "text-zinc-400"
          }`}
        >
          编年史
        </button>
        <button
          onClick={() => setMobileTab("cabinet")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mobileTab === "cabinet"
              ? "text-amber-400 border-t-2 border-amber-500"
              : "text-zinc-400"
          }`}
        >
          内阁
        </button>
        <button
          onClick={() => setMobileTab("intelligence")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mobileTab === "intelligence"
              ? "text-amber-400 border-t-2 border-amber-500"
              : "text-zinc-400"
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
            setTurnResults([]);
            setShowSaveManager(false);
          }}
          onClose={() => setShowSaveManager(false)}
        />
      )}
    </div>
  );
}
