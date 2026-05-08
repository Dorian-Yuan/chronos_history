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
}: StatBarProps) {
  if (type === "text" || typeof value === "string") {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs text-text-primary">{value}</span>
      </div>
    );
  }

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const barColor = color === "chaos" ? getChaosColor(value) : colorMap[color];

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-mono text-text-primary">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
