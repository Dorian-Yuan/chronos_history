import { useState } from "react";
import { useGameDispatch, useGameState } from "@/lib/game";
import { hasAutoSave, loadAutoSave } from "@/lib/game";
import {
  DisclaimerModal,
  SaveManager,
  HistoryArchive,
} from "@/components/game";
import { Settings, Archive, Save, Globe, BookOpen, FolderOpen } from "lucide-react";
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
    <main className="flex h-full flex-col items-center justify-center px-6 stripe-texture">
      <DisclaimerModal />

      <div className="relative z-10 mb-16 text-center space-y-5 animate-fade-in">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[#333333] mb-2">
          <Globe size={32} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-[0.15em] text-text-primary">
          CHRONOS
        </h1>
        <div className="w-12 h-0.5 bg-[#2A2A2E] mx-auto rounded-full" />
        <p className="text-sm text-[#999999] tracking-[0.3em]">
          历史的回响 / 决策推演
        </p>
        <p className="italic text-lg text-[#AAAAAA] max-w-[280px] mx-auto leading-[1.8]">
          &ldquo;历史不是记忆的负担，而是灵魂的启迪。&rdquo;
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-4 w-full max-w-[240px] animate-slide-up">
        <button
          onClick={handleEnter}
          className="btn-primary w-full h-14 text-base"
        >
          <BookOpen size={18} className="text-black" />
          进入历史
        </button>

        {canContinue && (
          <button
            onClick={handleContinue}
            className="btn-secondary w-full h-14 text-base"
          >
            <FolderOpen size={18} />
            继续游戏
          </button>
        )}
      </div>

      <div className="relative z-10 absolute bottom-8 flex gap-6 justify-center">
        <button
          onClick={() => setShowSaveManager(true)}
          className="btn-ghost py-2.5 text-sm"
        >
          <Save size={14} />
          存档
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="btn-ghost py-2.5 text-sm"
        >
          <Archive size={14} />
          档案
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="btn-ghost py-2.5 text-sm"
        >
          <Settings size={14} />
          设置
        </button>
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
