import { useState } from "react";
import { useGameDispatch, useGameState } from "@/lib/game";
import { hasAutoSave, loadAutoSave } from "@/lib/game";
import {
  DisclaimerModal,
  SaveManager,
  HistoryArchive,
} from "@/components/game";
import { Settings, Archive, Save } from "lucide-react";
import { useUIStore } from "@/stores";

export function StartPage() {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

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
    <main className="flex h-full flex-col items-center justify-center px-6">
      <DisclaimerModal />

      <div className="mb-20 text-center space-y-5 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-bg-tertiary/60 border border-border mb-2">
          <span className="text-2xl">⏳</span>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-[0.15em] text-text-primary">
          CHRONOS
        </h1>
        <div className="w-12 h-0.5 bg-accent-primary/40 mx-auto rounded-full" />
        <p className="font-serif text-lg text-text-secondary tracking-wide">
          历史的回响
        </p>
        <p className="font-serif text-sm text-text-tertiary tracking-wider">
          决策推演
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-[15rem] animate-slide-up">
        <button
          onClick={handleEnter}
          className="btn-primary w-full text-base py-3"
        >
          进入历史
        </button>

        {canContinue && (
          <button
            onClick={handleContinue}
            className="btn-secondary w-full text-base py-3"
          >
            继续游戏
          </button>
        )}

        <div className="h-px bg-border my-3" />

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setShowSaveManager(true)}
            className="btn-ghost py-2.5"
          >
            <Save size={14} />
            存档
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost py-2.5"
          >
            <Archive size={14} />
            档案
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="btn-ghost py-2.5"
          >
            <Settings size={14} />
            设置
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
