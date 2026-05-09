import { useState, useEffect, useRef } from "react";
import type { HistoryRecord } from "@/types";
import { getHistoryRecords } from "@/lib/game";
import { X } from "lucide-react";

interface HistoryArchiveProps {
  onClose: () => void;
}

export function HistoryArchive({ onClose }: HistoryArchiveProps) {
  const [records] = useState<HistoryRecord[]>(() => getHistoryRecords());
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

  const OUTCOME_STYLES: Record<string, string> = {
    victory: "bg-green-900/20 text-green-400 border-green-800/20",
    neutral: "bg-amber-900/20 text-amber-400 border-amber-800/20",
    defeat: "bg-red-900/20 text-red-400 border-red-800/20",
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content max-w-lg">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            历史档案
          </h2>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-all"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body max-h-[60vh]">
          {records.length === 0 ? (
            <div className="text-center py-12 text-sm text-text-tertiary">
              暂无历史记录
            </div>
          ) : (
            <ul className="space-y-4">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="rounded-lg border border-border bg-bg-card px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {record.scenarioTitle}
                    </span>
                    <span
                      className={`badge ${OUTCOME_STYLES[record.outcome] || "bg-zinc-800/30 text-zinc-400 border-zinc-700/20"}`}
                    >
                      {record.outcome === "victory"
                        ? "胜利"
                        : record.outcome === "defeat"
                          ? "失败"
                          : "存续"}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary leading-relaxed">
                    {record.nationName} · {record.leaderTitle} ·{" "}
                    {record.turnCount}回合
                  </div>
                  <div className="text-xs text-text-tertiary mt-1.5">
                    {record.personaTitle} · 历史原型：{record.realEventTitle}
                  </div>
                  <div className="text-xs text-text-tertiary/60 mt-2">
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
