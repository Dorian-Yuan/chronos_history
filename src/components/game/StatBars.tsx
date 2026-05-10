import type { GameStats, StatsDelta } from "@/types";
import { Scale, Coins, Swords, Globe } from "lucide-react";

interface StatBarsProps {
  stats: GameStats;
  delta?: StatsDelta;
}

const STAT_CONFIG = [
  {
    key: "stability" as const,
    label: "稳定性",
    icon: Scale,
  },
  {
    key: "economy" as const,
    label: "经济",
    icon: Coins,
  },
  {
    key: "military" as const,
    label: "军事",
    icon: Swords,
  },
  {
    key: "international_standing" as const,
    label: "国际声望",
    icon: Globe,
  },
];

function getBarColorVar(value: number): string {
  if (value >= 70) return "var(--color-accent-primary)";
  return "var(--color-accent-secondary)";
}

export function StatBars({ stats, delta }: StatBarsProps) {
  return (
    <div className="px-5 pt-4 pb-5 border-b border-border">
      <div
        className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-border bg-bg-card p-4"
        role="group"
        aria-label="国家属性"
      >
        {STAT_CONFIG.map(({ key, label, icon: Icon }) => {
          const value = stats[key];
          const deltaValue = delta?.[key] ?? 0;

          return (
            <div key={key} className="space-y-2">
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
