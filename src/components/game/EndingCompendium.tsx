import { useState, useEffect, useRef, useMemo } from "react";
import type {
  CompendiumEntry,
  HistoryRecord,
  SimilarFigureEntry,
  GameUniverse,
} from "@/types";
import {
  getPersonaCompendium,
  getHistoryCompendium,
  getHistoryRecords,
  getSimilarFigureCompendium,
} from "@/lib/game";
import { X, Crown, ScrollText, ClipboardList, Users } from "lucide-react";
import { getTerminology } from "@/config/terminology";

interface EndingCompendiumProps {
  onClose: () => void;
  universe?: GameUniverse;
}

type CompendiumTab = "records" | "persona" | "history" | "similarFigure";

export function EndingCompendium({
  onClose,
  universe = "history",
}: EndingCompendiumProps) {
  const [tab, setTab] = useState<CompendiumTab>("records");
  const [records] = useState<HistoryRecord[]>(() => getHistoryRecords());
  const [personaEntries] = useState<CompendiumEntry[]>(() =>
    getPersonaCompendium(),
  );
  const [historyEntries] = useState<CompendiumEntry[]>(() =>
    getHistoryCompendium(),
  );
  const [similarFigures] = useState<SimilarFigureEntry[]>(() =>
    getSimilarFigureCompendium(),
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const term = useMemo(() => getTerminology(universe), [universe]);

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
    records: {
      label: "记录存档",
      icon: ClipboardList,
      colorVar: "--color-accent-primary",
    },
    persona: {
      label: term.rulerPortraitLabel,
      icon: Crown,
      colorVar: "--color-accent-secondary",
    },
    history: {
      label: "真实历史",
      icon: ScrollText,
      colorVar: "--color-accent-info",
    },
    similarFigure: {
      label: "相似人物",
      icon: Users,
      colorVar: "--color-accent-warning",
    },
  };

  const OUTCOME_STYLES: Record<string, string> = {
    victory:
      "bg-status-success-bg text-status-success-text border border-status-success-border",
    neutral:
      "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
    defeat:
      "bg-status-error-bg text-status-error-text border border-status-error-border",
  };

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
            档案图鉴
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
          {tab === "records" && (
            <>
              {records.length === 0 ? (
                <div className="text-center py-12 text-sm text-text-tertiary font-serif">
                  暂无游戏记录
                  <p className="text-xs mt-2 text-text-tertiary/60">
                    完成游戏后自动收录
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {records.map((record) => (
                    <li
                      key={record.id}
                      className="rounded-lg border border-border bg-bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold font-serif text-text-primary">
                          {record.scenarioTitle}
                        </span>
                        <span
                          className={`badge ${OUTCOME_STYLES[record.outcome] || "bg-bg-tertiary text-text-tertiary"}`}
                        >
                          {term.outcomeLabels[
                            record.outcome as keyof typeof term.outcomeLabels
                          ] || record.outcome}
                        </span>
                      </div>
                      <div className="text-xs text-text-tertiary font-serif leading-relaxed">
                        {record.nationName} · {record.leaderTitle} ·{" "}
                        {record.turnCount}
                        {term.turnLabel}
                      </div>
                      <div className="text-xs text-text-tertiary/60 mt-2">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "persona" && (
            <>
              {personaEntries.length === 0 ? (
                <div className="text-center py-12 text-sm text-text-tertiary font-serif">
                  {`尚未收集任何${term.rulerPortraitLabel}`}
                  <p className="text-xs mt-2 text-text-tertiary/60">
                    完成游戏后自动收录
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {personaEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-border bg-bg-card p-4"
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
            </>
          )}

          {tab === "history" && (
            <>
              {historyEntries.length === 0 ? (
                <div className="text-center py-12 text-sm text-text-tertiary font-serif">
                  尚未收集任何历史事件
                  <p className="text-xs mt-2 text-text-tertiary/60">
                    完成游戏后自动收录
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {historyEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-border bg-bg-card p-4"
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
            </>
          )}

          {tab === "similarFigure" && (
            <>
              {similarFigures.length === 0 ? (
                <div className="text-center py-12 text-sm text-text-tertiary font-serif">
                  尚未收集任何相似人物
                  <p className="text-xs mt-2 text-text-tertiary/60">
                    完成游戏后自动收录
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {similarFigures.map((figure) => (
                    <li
                      key={figure.id}
                      className="rounded-lg border border-border bg-bg-card px-4 py-3 flex items-center justify-between"
                    >
                      <span className="text-sm font-serif font-bold text-text-primary">
                        {figure.name}
                      </span>
                      <span className="badge bg-bg-tertiary text-text-tertiary">
                        ×{figure.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="modal-footer text-center">
          <span className="text-xs text-text-tertiary font-serif">
            已进行 {records.length} 局游戏 · 收集 {personaEntries.length} 个画像
            · {historyEntries.length} 个历史事件 · {similarFigures.length}{" "}
            个相似人物
          </span>
        </div>
      </div>
    </div>
  );
}
