import { useGameState, useGameDispatch } from "@/lib/game";
import { EndGameReport } from "@/components/game";
import { determineOutcome } from "@/types";

export function EndPage() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  if (!state.endGameAnalysis || !state.scenario) return null;

  const outcome = determineOutcome(state.stats);

  return (
    <main className="h-full overflow-y-auto bg-zinc-950">
      <EndGameReport
        analysis={state.endGameAnalysis}
        stats={state.stats}
        outcome={outcome}
        turnCount={state.turnCount}
      />

      <div className="flex justify-center gap-4 pb-8">
        <button
          onClick={() => {
            dispatch({ type: "ENTER_SELECTION" });
          }}
          className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          再来一局
        </button>
        <button
          onClick={() => {
            dispatch({ type: "RESET" });
          }}
          className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          返回主页
        </button>
      </div>
    </main>
  );
}
