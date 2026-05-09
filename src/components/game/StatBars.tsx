import type { GameStats, StatsDelta } from "@/types";

interface StatBarsProps {
  stats: GameStats;
  delta?: StatsDelta;
}

const STAT_CONFIG = [
  {
    key: "stability" as const,
    label: "稳定性",
    icon: "⚖️",
    colorClass: "bg-accent-info",
  },
  {
    key: "economy" as const,
    label: "经济",
    icon: "💰",
    colorClass: "bg-accent-success",
  },
  {
    key: "military" as const,
    label: "军事",
    icon: "⚔️",
    colorClass: "bg-accent-danger",
  },
  {
    key: "international_standing" as const,
    label: "国际声望",
    icon: "🌍",
    colorClass: "bg-accent-primary",
  },
];

function getBarColor(value: number): string {
  if (value < 30) return "bg-red-500";
  if (value <= 70) return "bg-amber-500";
  return "bg-green-500";
}

function getTextColor(value: number): string {
  if (value < 30) return "text-red-400";
  if (value <= 70) return "text-amber-400";
  return "text-green-400";
}

export function StatBars({ stats, delta }: StatBarsProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 border-b border-border bg-bg-secondary/30"
      role="group"
      aria-label="国家属性"
    >
      {STAT_CONFIG.map(({ key, label, icon }) => {
        const value = stats[key];
        const deltaValue = delta?.[key] ?? 0;

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                <span aria-hidden="true">{icon}</span> {label}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-xs font-semibold ${getTextColor(value)}`}
                >
                  {value}
                </span>
                {deltaValue !== 0 && (
                  <span
                    className={`font-mono text-xs font-medium ${deltaValue > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {deltaValue > 0 ? `+${deltaValue}` : deltaValue}
                  </span>
                )}
              </div>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label}: ${value}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${getBarColor(value)}`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
