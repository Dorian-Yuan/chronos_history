import { useWorldStateStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";

export function ChaosHistoryChart() {
  const { t } = useTranslation();
  const historyPoints = useWorldStateStore((s) => s.historyPoints);
  const worldState = useWorldStateStore((s) => s.worldState);

  const points = worldState
    ? [
        ...historyPoints,
        { year: worldState.year, chaos: worldState.chaosLevel },
      ]
    : historyPoints;

  if (points.length < 2) return null;

  const width = 300;
  const height = 80;
  const padding = 10;

  const xStep = (width - padding * 2) / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (p.chaos / 100) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${padding + (points.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-2">
        {t("state.chaosLevel")}
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        <defs>
          <linearGradient id="chaosGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-chaos-high)"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="var(--color-chaos-high)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chaosGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-chaos-medium)"
          strokeWidth="1.5"
        />
        {points.map((p, i) => {
          const x = padding + i * xStep;
          const y = height - padding - (p.chaos / 100) * (height - padding * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="var(--color-chaos-medium)"
            />
          );
        })}
      </svg>
    </div>
  );
}
