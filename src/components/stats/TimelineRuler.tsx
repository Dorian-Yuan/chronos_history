import { useState } from "react";
import { useWorldStateStore } from "@/stores";
import { useSessionStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getDB } from "@/lib/db/schema";
import type { WorldState } from "@/types";

export function TimelineRuler() {
  const { t } = useTranslation();
  const historyPoints = useWorldStateStore((s) => s.historyPoints);
  const worldState = useWorldStateStore((s) => s.worldState);
  const setWorldState = useWorldStateStore((s) => s.setWorldState);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (!historyPoints.length && !worldState) return null;

  const points = worldState
    ? [
        ...historyPoints,
        { year: worldState.year, chaos: worldState.chaosLevel },
      ]
    : historyPoints;

  const minYear = Math.min(...points.map((p) => p.year));
  const maxYear = Math.max(...points.map((p) => p.year));
  const range = maxYear - minYear || 1;

  const handlePointClick = async (year: number) => {
    setSelectedYear(year);
    if (!currentSessionId) return;
    try {
      const db = await getDB();
      const allStates = await db.getAllFromIndex(
        "worldStates",
        "by-session",
        currentSessionId,
      );
      const match = allStates.find((ws) => ws.year === year);
      if (match && match.state) {
        setWorldState(match.state as WorldState);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-serif text-sm font-medium text-accent-primary decorative-line mb-4">
        {t("game.timeline")}
      </h3>
      <div className="relative h-20">
        <div className="absolute bottom-4 left-0 right-0 h-px bg-border" />
        {points.map((point, i) => {
          const left = ((point.year - minYear) / range) * 100;
          const isSelected = selectedYear === point.year;
          const isCurrent = worldState && point.year === worldState.year;
          return (
            <button
              key={i}
              onClick={() => handlePointClick(point.year)}
              className={`touch-target absolute bottom-4 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
                isSelected ? "scale-110" : ""
              }`}
              style={{ left: `${left}%` }}
            >
              <div
                className={`mx-auto rounded-full transition-all ${
                  isSelected
                    ? "h-3 w-3 bg-accent-warning shadow-lg"
                    : isCurrent
                      ? "h-2.5 w-2.5 bg-accent-primary shadow-md"
                      : "h-2 w-2 bg-accent-primary/50"
                }`}
                style={{
                  boxShadow:
                    isSelected || isCurrent
                      ? `0 0 8px ${isSelected ? "var(--color-accent-warning)" : "var(--color-accent-primary)"}60`
                      : "none",
                }}
              />
              <span
                className={`mt-1.5 block whitespace-nowrap text-center font-mono text-[10px] ${
                  isSelected
                    ? "font-bold text-accent-warning"
                    : isCurrent
                      ? "font-medium text-accent-primary"
                      : "text-text-tertiary"
                }`}
              >
                {point.year}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
