import { useState } from "react";
import { useGameDispatch, useGameState } from "@/lib/game";
import { hasAutoSave, loadAutoSave } from "@/lib/game";
import {
  DisclaimerModal,
  SaveManager,
  HistoryArchive,
} from "@/components/game";

export function StartPage() {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canContinue = hasAutoSave();

  const handleEnter = () => {
    dispatch({ type: "ENTER_SELECTION" });
  };

  const handleContinue = () => {
    const save = loadAutoSave();
    if (save) {
      dispatch({ type: "LOAD_SAVE", state: save.state });
    }
  };

  return (
    <main className="flex h-full flex-col items-center justify-center bg-zinc-950 px-4">
      <DisclaimerModal />

      <div className="mb-12 text-center">
        <h1 className="mb-2 text-5xl font-mono font-bold tracking-widest text-zinc-100">
          CHRONOS
        </h1>
        <p className="font-serif text-lg text-zinc-400">
          历史的回响 / 决策推演
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={handleEnter}
          className="w-full rounded-lg bg-amber-600 px-6 py-3 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          进入历史
        </button>

        {canContinue && (
          <button
            onClick={handleContinue}
            className="w-full rounded-lg border border-zinc-700 px-6 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            继续游戏
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveManager(true)}
            className="flex-1 rounded-lg border border-zinc-800 px-4 py-2.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            存档管理
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 rounded-lg border border-zinc-800 px-4 py-2.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            历史档案
          </button>
        </div>
      </div>

      {showSaveManager && (
        <SaveManager
          gameState={state}
          onLoad={(gameState) =>
            dispatch({ type: "LOAD_SAVE", state: gameState })
          }
          onClose={() => setShowSaveManager(false)}
        />
      )}

      {showHistory && <HistoryArchive onClose={() => setShowHistory(false)} />}
    </main>
  );
}
