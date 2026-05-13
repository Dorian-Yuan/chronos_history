import { useMemo } from "react";
import { useGameState, useGameDispatch } from "@/lib/game";
import { EndGameReport } from "@/components/game";
import { determineConditionalOutcome } from "@/types";
import type { GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";

export function EndPage() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const universe: GameUniverse = state.universe || "history";
  const term = useMemo(() => getTerminology(universe), [universe]);

  if (!state.endGameAnalysis || !state.scenario) return null;

  const conditionalOutcome = determineConditionalOutcome({
    stats: state.stats,
    playStyle: state.scenario.play_style,
    lifeMode: state.scenario.life_mode,
    factions: state.scenario.factions,
    turnCount: state.turnCount,
    playerRank: state.scenario.player_context?.official_rank?.level,
  });

  return (
    <main className="h-full overflow-y-auto">
      <EndGameReport
        analysis={state.endGameAnalysis}
        stats={state.stats}
        outcome={conditionalOutcome.base}
        conditionalOutcome={conditionalOutcome}
        turnCount={state.turnCount}
        universe={universe}
      />

      <div
        className="flex justify-center gap-4 px-6 pt-4"
        style={{
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          onClick={() => {
            if (universe === "life") {
              dispatch({ type: "ENTER_LIFE_SELECTION" });
            } else {
              dispatch({ type: "ENTER_SELECTION" });
            }
          }}
          className="btn-primary text-base px-8 py-3"
        >
          {term.playAgainButton}
        </button>
        <button
          onClick={() => {
            dispatch({ type: "RESET" });
          }}
          className="btn-secondary text-base px-8 py-3"
        >
          {term.backToHomeButton}
        </button>
      </div>
    </main>
  );
}
