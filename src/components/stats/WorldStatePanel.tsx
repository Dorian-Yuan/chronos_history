import { useWorldStateStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { StatBar } from "./StatBar";
import { DeviationsList } from "./DeviationsList";

const categoryColors: Record<string, string> = {
  chaos: "var(--color-chaos-medium)",
  economy: "var(--color-economy)",
  military: "var(--color-military)",
  technology: "var(--color-technology)",
  culture: "var(--color-culture)",
  info: "var(--color-accent-info)",
};

interface StatItem {
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

export function WorldStatePanel() {
  const { t } = useTranslation();
  const worldState = useWorldStateStore((s) => s.worldState);

  if (!worldState) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-text-tertiary">
        <p className="text-sm">{t("game.newGame")}</p>
      </div>
    );
  }

  const categories: {
    key: string;
    label: string;
    color: string;
    stats: StatItem[];
  }[] = [
    {
      key: "overview",
      label: t("game.worldState"),
      color: categoryColors.info,
      stats: [
        {
          label: t("state.chaosLevel"),
          value: worldState.chaosLevel,
          max: 100,
          color: "chaos",
          danger: worldState.chaosLevel > 70,
        },
        {
          label: t("state.stability"),
          value: worldState.geopoliticalStability,
          max: 100,
          color: "info",
        },
        {
          label: t("state.populationMood"),
          value: worldState.populationMood,
          type: "text",
        },
      ],
    },
    {
      key: "economy",
      label: t("state.economy"),
      color: categoryColors.economy,
      stats: [
        {
          label: t("state.gdp"),
          value: worldState.economy.gdp,
          max: 100,
          color: "economy",
        },
        {
          label: t("state.trade"),
          value: worldState.economy.trade,
          max: 100,
          color: "economy",
        },
        {
          label: t("state.resources"),
          value: worldState.economy.resources,
          max: 100,
          color: "economy",
        },
      ],
    },
    {
      key: "military",
      label: t("state.military"),
      color: categoryColors.military,
      stats: [
        {
          label: t("state.power"),
          value: worldState.military.power,
          max: 100,
          color: "military",
        },
        {
          label: t("state.defense"),
          value: worldState.military.defense,
          max: 100,
          color: "military",
        },
      ],
    },
    {
      key: "technology",
      label: t("state.technology"),
      color: categoryColors.technology,
      stats: [
        {
          label: t("state.technology"),
          value: worldState.technology.level,
          max: 100,
          color: "technology",
        },
      ],
    },
    {
      key: "culture",
      label: t("state.culture"),
      color: categoryColors.culture,
      stats: [
        {
          label: t("state.culture"),
          value: worldState.culture.development,
          max: 100,
          color: "culture",
        },
      ],
    },
  ];

  return (
    <div className="h-full overflow-auto p-4 space-y-3">
      {categories.map((cat) => (
        <div
          key={cat.key}
          className="stat-category-card"
          style={{ borderLeftColor: cat.color }}
        >
          <h3
            className="font-serif text-xs font-semibold mb-2"
            style={{ color: cat.color }}
          >
            {cat.label}
          </h3>
          <div className="space-y-1">
            {cat.stats.map((stat) => (
              <StatBar
                key={stat.label}
                label={stat.label}
                value={stat.value}
                max={stat.max}
                color={stat.color}
                type={stat.type}
                danger={stat.danger}
              />
            ))}
          </div>
        </div>
      ))}

      <DeviationsList deviations={worldState.deviations} />
    </div>
  );
}
