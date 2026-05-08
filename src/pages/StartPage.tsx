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

      <div className="mb-16 text-center space-y-4 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-tertiary/60 border border-border mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-[0.15em] text-text-primary">
          CHRONOS
        </h1>
        <div className="w-12 h-0.5 bg-accent-primary/40 mx-auto rounded-full" />
        <p className="font-serif text-lg text-text-secondary tracking-wide">
          历史的回响 / 决策推演
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm animate-slide-up">
        <button
          onClick={handleEnter}
          className="btn-primary w-full text-base py-3.5"
        >
          进入历史
        </button>

        {canContinue && (
          <button
            onClick={handleContinue}
            className="btn-secondary w-full text-base py-3.5"
          >
            继续游戏
          </button>
        )}

        <div className="h-px bg-border my-2" />

        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveManager(true)}
            className="btn-ghost flex-1 py-3"
          >
            <Save size={14} />
            存档管理
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost flex-1 py-3"
          >
            <Archive size={14} />
            历史档案
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="btn-ghost flex-1 py-3"
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
