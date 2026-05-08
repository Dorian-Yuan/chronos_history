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
  const height = 100;
  const padding = 16;

  const xStep = (width - padding * 2) / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = padding + i * xStep;
      const y = height - padding - (p.chaos / 100) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${padding + (points.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`;

  const yTicks = [0, 50, 100];

  return (
    <div className="p-4">
      <h3 className="font-serif text-sm font-medium text-accent-primary decorative-line mb-3">
        {t("state.chaosLevel")}
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chaosGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-chaos-high)"
              stopOpacity="0.25"
            />
            <stop
              offset="100%"
              stopColor="var(--color-chaos-high)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = height - padding - (tick / 100) * (height - padding * 2);
          return (
            <line
              key={tick}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          );
        })}
        <path d={areaD} fill="url(#chaosGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-chaos-medium)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const x = padding + i * xStep;
          const y = height - padding - (p.chaos / 100) * (height - padding * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="var(--color-chaos-medium)"
              stroke="var(--color-bg-card)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}
