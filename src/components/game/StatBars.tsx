import type { GameStats, StatsDelta } from "@/types";

interface StatBarsProps {
  stats: GameStats;
  delta?: StatsDelta;
}

const STAT_CONFIG = [
  { key: "stability" as const, label: "稳定性", icon: "⚖️" },
  { key: "economy" as const, label: "经济", icon: "💰" },
  { key: "military" as const, label: "军事", icon: "⚔️" },
  { key: "international_standing" as const, label: "国际声望", icon: "🌍" },
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
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2"
      role="group"
      aria-label="国家属性"
    >
      {STAT_CONFIG.map(({ key, label, icon }) => {
        const value = stats[key];
        const deltaValue = delta?.[key] ?? 0;

        return (
          <div key={key} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                <span aria-hidden="true">{icon}</span> {label}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono text-xs font-medium ${getTextColor(value)}`}
                >
                  {value}
                </span>
                {deltaValue !== 0 && (
                  <span
                    className={`font-mono text-xs ${deltaValue > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {deltaValue > 0 ? `+${deltaValue}` : deltaValue}
                  </span>
                )}
              </div>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
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
