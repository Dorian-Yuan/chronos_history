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
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        {t("game.timeline")}
      </h3>
      <div className="relative h-16">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
        {points.map((point, i) => {
          const left = ((point.year - minYear) / range) * 100;
          const isSelected = selectedYear === point.year;
          const isCurrent = worldState && point.year === worldState.year;
          return (
            <button
              key={i}
              onClick={() => handlePointClick(point.year)}
              className={`absolute bottom-0 -translate-x-1/2 cursor-pointer transition-all duration-200 hover:scale-125 ${
                isSelected ? "scale-125" : ""
              }`}
              style={{ left: `${left}%` }}
            >
              <div
                className={`h-2 w-px ${isSelected ? "bg-accent-warning w-0.5 h-3" : isCurrent ? "bg-accent-success" : "bg-accent-primary"}`}
              />
              <span
                className={`text-[10px] mt-1 block whitespace-nowrap ${
                  isSelected
                    ? "text-accent-warning font-bold"
                    : isCurrent
                      ? "text-accent-success"
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
