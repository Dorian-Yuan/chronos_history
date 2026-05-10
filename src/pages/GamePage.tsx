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
import {
  Settings,
  Save,
  User,
  BookOpen,
  Users,
  Radar,
} from "lucide-react";
import { useUIStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";

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

const TAB_CONFIG = {
  chronicle: { icon: BookOpen, label: "编年史", color: "#2ECE8B" },
  cabinet: { icon: Users, label: "内阁", color: "#E8833A" },
  intelligence: { icon: Radar, label: "情报", color: "#4A9EF5" },
} as const;

export function GamePage() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { t } = useTranslation();
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

  const renderTabButton = (
    tabKey: "chronicle" | SideTab,
    onClick: () => void,
    isActive: boolean,
  ) => {
    const config = TAB_CONFIG[tabKey];
    const Icon = config.icon;
    return (
      <button
        onClick={onClick}
        role="tab"
        aria-selected={isActive}
        className="flex flex-col items-center justify-center gap-1 flex-1 py-3 relative transition-colors"
      >
        <Icon
          size={20}
          className={isActive ? "" : "text-[#666666]"}
          style={isActive ? { color: config.color } : undefined}
        />
        <span
          className={`text-[13px] font-semibold ${isActive ? "" : "text-[#666666]"}`}
          style={isActive ? { color: config.color } : undefined}
        >
          {config.label}
        </span>
        {isActive && (
          <div
            className="absolute bottom-0 h-[3px] w-10 rounded-full"
            style={{ backgroundColor: config.color }}
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between rounded-lg border border-[#2A2A2E] bg-[#1A1A1E] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#3A3A3E] bg-[#2A2A2E]">
              <User size={20} className="text-[#666666]" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-[#666666]">
                {t("game.currentIdentity")}
              </div>
              <div className="text-lg font-bold text-text-primary">
                {nationName}
              </div>
              <div className="text-[13px] text-[#2ECE8B]">{leaderTitle}</div>
            </div>
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
        </div>
      </header>

      <StatBars stats={state.stats} delta={currentDelta} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`flex-1 flex-col overflow-hidden md:flex ${mobileTab !== "chronicle" ? "hidden" : "flex"}`}
          >
            {error && (
              <div className="mx-6 mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2.5 text-xs text-red-400 flex items-center justify-between">
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
              placeholder={`下达指令...（外交、经济、军事等）`}
            />
          </div>

          <div
            className={`flex-1 flex-col overflow-y-auto md:hidden ${mobileTab === "chronicle" ? "hidden" : "flex"}`}
          >
            {mobileTab === "cabinet" ? (
              <CabinetPanel advisors={currentAdvisors} />
            ) : (
              <IntelligencePanel factions={currentFactions} />
            )}
          </div>
        </div>

        <div className="hidden md:flex w-80 shrink-0 flex-col border-l border-[#2A2A2E] bg-[#141418]">
          <div
            className="flex border-b border-[#2A2A2E]"
            role="tablist"
            aria-label="侧边栏"
          >
            {renderTabButton(
              "cabinet",
              () => setSideTab("cabinet"),
              sideTab === "cabinet",
            )}
            {renderTabButton(
              "intelligence",
              () => setSideTab("intelligence"),
              sideTab === "intelligence",
            )}
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
        className="flex md:hidden border-t border-[#2A2A2E] glass safe-bottom"
        aria-label="游戏面板"
      >
        {renderTabButton(
          "chronicle",
          () => setMobileTab("chronicle"),
          mobileTab === "chronicle",
        )}
        {renderTabButton(
          "cabinet",
          () => setMobileTab("cabinet"),
          mobileTab === "cabinet",
        )}
        {renderTabButton(
          "intelligence",
          () => setMobileTab("intelligence"),
          mobileTab === "intelligence",
        )}
      </nav>

      <footer className="hidden md:flex items-center justify-between h-11 px-6 border-t border-[#2A2A2E] bg-[#141418] text-xs text-[#666666]">
        <span className="font-mono">TURN: {state.turnCount}</span>
        <span>{scenarioTitle}</span>
        <button
          onClick={() => setShowSaveManager(true)}
          className="flex items-center gap-1.5 text-[#666666] hover:text-text-primary transition-colors"
        >
          <Save size={12} />
          存档
        </button>
      </footer>

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
