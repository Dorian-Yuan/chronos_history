interface StatBarProps {
  label: string;
  value: number | string;
  max?: number;
  color?:
    | "chaos"
    | "info"
    | "economy"
    | "military"
    | "technology"
    | "culture"
    | "primary";
  type?: "gauge" | "text";
  danger?: boolean;
}

const colorMap: Record<string, string> = {
  chaos: "var(--color-chaos-medium)",
  info: "var(--color-accent-info)",
  economy: "var(--color-economy)",
  military: "var(--color-military)",
  technology: "var(--color-technology)",
  culture: "var(--color-culture)",
  primary: "var(--color-accent-primary)",
};

function getChaosColor(value: number): string {
  if (value < 33) return "var(--color-chaos-low)";
  if (value < 66) return "var(--color-chaos-medium)";
  return "var(--color-chaos-high)";
}

export function StatBar({
  label,
  value,
  max = 100,
  color = "primary",
  type = "gauge",
  danger = false,
}: StatBarProps) {
  if (type === "text" || typeof value === "string") {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium text-text-primary">{value}</span>
      </div>
    );
  }

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color === "chaos" ? getChaosColor(value) : colorMap[color];

  return (
    <div className={`py-2 ${danger ? "stat-danger-zone" : ""}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span
          className={`font-mono text-xs font-medium ${danger ? "text-accent-danger animate-danger-pulse" : "text-text-primary"}`}
        >
          {value}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
        <div
          className="stat-bar-fill h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: danger ? "var(--color-accent-danger)" : barColor,
            boxShadow: `0 0 8px ${danger ? "var(--color-accent-danger)" : barColor}40`,
          }}
        />
      </div>
    </div>
  );
}
