import { useMemo } from "react";
import type { GameStats, StatsDelta, GameUniverse } from "@/types";
import { Scale, Coins, Swords, Globe } from "lucide-react";
import { getTerminology } from "@/config/terminology";

interface StatBarsProps {
  stats: GameStats;
  delta?: StatsDelta;
  universe?: GameUniverse;
}

const STAT_KEYS = [
  { key: "stability" as const, icon: Scale },
  { key: "economy" as const, icon: Coins },
  { key: "military" as const, icon: Swords },
  { key: "international_standing" as const, icon: Globe },
];

function getBarColorVar(value: number): string {
  if (value >= 70) return "var(--color-accent-primary)";
  return "var(--color-accent-secondary)";
}

export function StatBars({
  stats,
  delta,
  universe = "history",
}: StatBarsProps) {
  const term = useMemo(() => getTerminology(universe), [universe]);

  return (
    <div className="px-5">
      <div
        className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-border bg-bg-card p-4"
        role="group"
        aria-label={term.statAriaLabel}
      >
        {STAT_KEYS.map(({ key, icon: Icon }) => {
          const value = stats[key];
          const deltaValue = delta?.[key] ?? 0;
          const label = term.statLabels[key];

          return (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Icon size={11} className="text-text-tertiary" />
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    {value}
                  </span>
                  {deltaValue !== 0 && (
                    <span
                      className={`font-mono text-xs font-medium ${deltaValue > 0 ? "text-accent-primary" : "text-accent-danger"}`}
                    >
                      {deltaValue > 0 ? `+${deltaValue}` : deltaValue}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-sm bg-bg-tertiary"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${value}`}
              >
                <div
                  className="h-full rounded-sm transition-all duration-700"
                  style={{
                    width: `${value}%`,
                    backgroundColor: getBarColorVar(value),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
