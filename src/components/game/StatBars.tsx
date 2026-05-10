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

function getBarColor(value: number): string {
  if (value >= 70) return "#2ECE8B";
  return "#E8833A";
}

function getTextColor(value: number): string {
  if (value >= 70) return "#2ECE8B";
  return "#E8833A";
}

export function StatBars({ stats, delta }: StatBarsProps) {
  return (
    <div className="px-6 py-4">
      <div
        className="grid grid-cols-2 gap-4 rounded-lg border border-[#2A2A2E] bg-[#1A1A1E] p-5"
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
                  <Icon size={12} className="text-[#666666]" />
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: getTextColor(value) }}
                  >
                    {value}
                  </span>
                  {deltaValue !== 0 && (
                    <span
                      className={`font-mono text-xs font-medium ${deltaValue > 0 ? "text-[#2ECE8B]" : "text-[#E85A5A]"}`}
                    >
                      {deltaValue > 0 ? `+${deltaValue}` : deltaValue}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-sm bg-[#2A2A2E]"
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
                    backgroundColor: getBarColor(value),
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
