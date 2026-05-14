import { useState, useMemo } from "react";
import { useGameDispatch, useGameState } from "@/lib/game";
import { hasAutoSave, loadAutoSave } from "@/lib/game";
import {
  DisclaimerModal,
  SaveManager,
  EndingCompendium,
} from "@/components/game";
import {
  Settings,
  Archive,
  Save,
  BookOpen,
  FolderOpen,
  Compass,
  Crown,
  Sword,
  Shield,
  Scroll,
  Castle,
  Flame,
  Skull,
  Star,
  Moon,
  Sun,
  Map as MapIcon,
  Clock,
  Landmark,
  Sparkles,
  Feather,
  Gem,
  TreePine,
} from "lucide-react";
import { useUIStore } from "@/stores";
import { useSettingsStore } from "@/stores";

const START_ICONS = [
  Crown,
  Sword,
  Shield,
  Scroll,
  Castle,
  Flame,
  Skull,
  Star,
  Moon,
  Sun,
  MapIcon,
  Clock,
  Landmark,
  Sparkles,
  Feather,
  Gem,
  TreePine,
  Compass,
  BookOpen,
] as const;

export function StartPage() {
  const dispatch = useGameDispatch();
  const state = useGameState();
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const experimentalMode = useSettingsStore((s) => s.experimentalMode);

  const RandomIcon = useMemo(
    () => START_ICONS[Math.floor(Math.random() * START_ICONS.length)],
    [],
  );

  const canContinue = hasAutoSave();

  const handleEnterHistory = () => {
    dispatch({ type: "ENTER_SELECTION" });
  };

  const handleEnterLife = () => {
    dispatch({ type: "ENTER_LIFE_SELECTION" });
  };

  const handleContinue = () => {
    const save = loadAutoSave();
    if (save) {
      dispatch({ type: "LOAD_SAVE", state: save.state });
    }
  };

  return (
    <main className="relative h-full flex flex-col items-center px-6 stripe-texture overflow-hidden">
      <DisclaimerModal />

      <div className="absolute top-[18%] left-0 right-0 z-10 flex flex-col items-center gap-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-xl bg-bg-tertiary/60 border border-border">
          <RandomIcon
            size={32}
            className="text-text-primary"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-[0.15em] text-text-primary">
          CHRONOS
        </h1>
      </div>

      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 z-10 flex flex-col gap-4 w-full max-w-[240px] animate-slide-up">
        <button
          onClick={handleEnterHistory}
          className="btn-primary w-full h-14 text-base"
        >
          <BookOpen size={18} className="text-btn-primary-text" />
          进入历史
        </button>

        {experimentalMode && (
          <button
            onClick={handleEnterLife}
            className="btn-primary w-full h-14 text-base"
          >
            <Compass size={18} className="text-btn-primary-text" />
            进入人生
          </button>
        )}

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

      <div className="absolute bottom-0 left-0 right-0 z-10 safe-bottom">
        <div className="flex gap-8 justify-center pb-8">
          <button
            onClick={() => setShowSaveManager(true)}
            className="btn-ghost py-2.5 text-sm"
          >
            <Save size={14} />
            存档
          </button>
          <button
            onClick={() => setShowArchive(true)}
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
      </div>

      {showSaveManager && (
        <SaveManager
          mode="start"
          gameState={state}
          onLoad={(gameState) =>
            dispatch({ type: "LOAD_SAVE", state: gameState })
          }
          onClose={() => setShowSaveManager(false)}
        />
      )}

      {showArchive && (
        <EndingCompendium
          onClose={() => setShowArchive(false)}
          universe={state.universe}
        />
      )}
    </main>
  );
}
