import { useState, useEffect, useRef } from "react";
import type { HistoryRecord } from "@/types";
import { getHistoryRecords } from "@/lib/game";

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
    victory: "text-green-400",
    neutral: "text-amber-400",
    defeat: "text-red-400",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-archive-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="history-archive-title"
            className="text-lg font-serif font-bold text-zinc-100"
          >
            历史档案
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500">
            暂无历史记录
          </div>
        ) : (
          <ul className="space-y-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-300">
                    {record.scenarioTitle}
                  </span>
                  <span
                    className={`text-xs font-medium ${OUTCOME_STYLES[record.outcome] || "text-zinc-400"}`}
                  >
                    {record.outcome === "victory"
                      ? "胜利"
                      : record.outcome === "defeat"
                        ? "失败"
                        : "存续"}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">
                  {record.nationName} · {record.leaderTitle} ·{" "}
                  {record.turnCount}回合
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {record.personaTitle} · 历史原型：{record.realEventTitle}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
