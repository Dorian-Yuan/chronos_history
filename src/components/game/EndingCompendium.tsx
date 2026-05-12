import { useState, useEffect, useRef } from "react";
import type { CompendiumEntry } from "@/types";
import { getPersonaCompendium, getHistoryCompendium } from "@/lib/game";
import { X, Crown, ScrollText } from "lucide-react";

interface EndingCompendiumProps {
  onClose: () => void;
}

type CompendiumTab = "persona" | "history";

export function EndingCompendium({ onClose }: EndingCompendiumProps) {
  const [tab, setTab] = useState<CompendiumTab>("persona");
  const [personaEntries] = useState<CompendiumEntry[]>(() =>
    getPersonaCompendium(),
  );
  const [historyEntries] = useState<CompendiumEntry[]>(() =>
    getHistoryCompendium(),
  );
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) {
      const firstFocusable =
        modalRef.current.querySelector<HTMLElement>("button, [tabindex]");
      firstFocusable?.focus();
    }
  }, []);

  const TAB_CONFIG: Record<
    CompendiumTab,
    { label: string; icon: typeof Crown; colorVar: string }
  > = {
    persona: {
      label: "统治者画像",
      icon: Crown,
      colorVar: "--color-accent-secondary",
    },
    history: {
      label: "真实历史",
      icon: ScrollText,
      colorVar: "--color-accent-info",
    },
  };

  const currentEntries = tab === "persona" ? personaEntries : historyEntries;

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content max-w-md">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            结局图鉴
          </h2>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-border">
          {(Object.keys(TAB_CONFIG) as CompendiumTab[]).map((tabKey) => {
            const config = TAB_CONFIG[tabKey];
            const Icon = config.icon;
            const isActive = tab === tabKey;
            const activeColor = `var(${config.colorVar})`;
            return (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold relative transition-colors"
                role="tab"
                aria-selected={isActive}
              >
                <Icon
                  size={13}
                  className={isActive ? "" : "text-text-tertiary"}
                  style={isActive ? { color: activeColor } : undefined}
                />
                <span
                  className={isActive ? "" : "text-text-tertiary"}
                  style={isActive ? { color: activeColor } : undefined}
                >
                  {config.label}
                </span>
                {isActive && (
                  <div
                    className="absolute bottom-0 h-[2px] w-8 rounded-full"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="modal-body max-h-[60vh]">
          {currentEntries.length === 0 ? (
            <div className="text-center py-12 text-sm text-text-tertiary font-serif">
              {tab === "persona"
                ? "尚未收集任何统治者画像"
                : "尚未收集任何历史事件"}
              <p className="text-xs mt-2 text-text-tertiary/60">
                完成游戏后自动收录
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {currentEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-border bg-bg-card p-5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-serif font-bold text-text-primary">
                      {entry.title}
                    </span>
                  </div>
                  <p className="text-xs font-serif text-text-secondary leading-relaxed">
                    {entry.description}
                  </p>
                  <div className="text-xs text-text-tertiary/60 mt-2">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer text-center">
          <span className="text-xs text-text-tertiary font-serif">
            已收集 {personaEntries.length} 个画像 · {historyEntries.length}{" "}
            个历史事件
          </span>
        </div>
      </div>
    </div>
  );
}
