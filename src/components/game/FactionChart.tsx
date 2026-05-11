import type { FactionChartData } from "@/types";

interface FactionChartProps {
  data: FactionChartData[];
  playerNation?: string;
}

const ATTITUDE_COLORS: Record<string, string> = {
  "敌对": "#e85a5a",
  "求和": "#4a9ef5",
  "中立": "#666666",
  "友好": "#2ece8b",
  "臣服": "#e8833a",
  "已灭亡": "#555555",
  "玩家": "#d4a843",
};

export function FactionChart({ data, playerNation }: FactionChartProps) {
  const sortedData = [...data].sort((a, b) => b.power - a.power);
  const maxPower = Math.max(...sortedData.map((d) => d.power), 1);

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-3">
      <h4 className="text-xs font-serif text-text-secondary mb-3">势力实力对比</h4>
      <div className="flex flex-col gap-2">
        {sortedData.map((faction) => {
          const isPlayer = faction.name === playerNation;
          const isDestroyed = faction.is_destroyed || faction.attitude === "已灭亡";
          const barColor = isPlayer
            ? ATTITUDE_COLORS["玩家"]
            : ATTITUDE_COLORS[faction.attitude] || "#666666";
          const barWidth = isDestroyed ? 0 : (faction.power / maxPower) * 100;

          return (
            <div key={faction.name} className="flex items-center gap-2">
              <span
                className={`text-[11px] font-serif shrink-0 w-16 text-right truncate ${
                  isPlayer ? "text-accent-primary font-medium" : "text-text-secondary"
                } ${isDestroyed ? "line-through opacity-50" : ""}`}
              >
                {faction.name}
              </span>
              <div className="flex-1 h-4 bg-bg-tertiary rounded-sm overflow-hidden relative">
                {isDestroyed ? (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      border: "1px dashed #555",
                      borderRadius: "2px",
                    }}
                  >
                    <span className="text-[9px] text-text-tertiary">已灭亡</span>
                  </div>
                ) : (
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                      opacity: 0.85,
                      boxShadow: isPlayer
                        ? `0 0 8px ${barColor}40`
                        : undefined,
                    }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-mono shrink-0 w-7 text-right ${
                  isDestroyed ? "text-text-tertiary/50" : "text-text-tertiary"
                }`}
              >
                {isDestroyed ? "—" : faction.power}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
