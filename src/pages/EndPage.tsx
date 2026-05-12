import { useGameState, useGameDispatch } from "@/lib/game";
import { EndGameReport } from "@/components/game";
import { determineConditionalOutcome } from "@/types";

export function EndPage() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  if (!state.endGameAnalysis || !state.scenario) return null;

  const conditionalOutcome = determineConditionalOutcome({
    stats: state.stats,
    playStyle: state.scenario.play_style,
    factions: state.scenario.factions,
    turnCount: state.turnCount,
  });

  return (
    <main className="h-full overflow-y-auto">
      <EndGameReport
        analysis={state.endGameAnalysis}
        stats={state.stats}
        outcome={conditionalOutcome.base}
        conditionalOutcome={conditionalOutcome}
        turnCount={state.turnCount}
      />

      <div
        className="flex justify-center gap-4 px-6 pt-4"
        style={{
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          onClick={() => {
            dispatch({ type: "ENTER_SELECTION" });
          }}
          className="btn-primary text-base px-8 py-3"
        >
          再来一局
        </button>
        <button
          onClick={() => {
            dispatch({ type: "RESET" });
          }}
          className="btn-secondary text-base px-8 py-3"
        >
          返回主页
        </button>
      </div>
    </main>
  );
}
