import { useWorldStateStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { StatBar } from "./StatBar";
import { DeviationsList } from "./DeviationsList";

export function WorldStatePanel() {
  const { t } = useTranslation();
  const worldState = useWorldStateStore((s) => s.worldState);

  if (!worldState) {
    return (
      <div className="flex h-full items-center justify-center text-text-tertiary">
        {t("game.newGame")}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("game.worldState")}
        </h3>
        <StatBar
          label={t("state.chaosLevel")}
          value={worldState.chaosLevel}
          max={100}
          color="chaos"
        />
        <StatBar
          label={t("state.stability")}
          value={worldState.geopoliticalStability}
          max={100}
          color="info"
        />
        <StatBar
          label={t("state.populationMood")}
          value={worldState.populationMood}
          type="text"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("state.economy")}
        </h3>
        <StatBar
          label={t("state.gdp")}
          value={worldState.economy.gdp}
          max={100}
          color="economy"
        />
        <StatBar
          label={t("state.trade")}
          value={worldState.economy.trade}
          max={100}
          color="economy"
        />
        <StatBar
          label={t("state.resources")}
          value={worldState.economy.resources}
          max={100}
          color="economy"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("state.military")}
        </h3>
        <StatBar
          label={t("state.power")}
          value={worldState.military.power}
          max={100}
          color="military"
        />
        <StatBar
          label={t("state.defense")}
          value={worldState.military.defense}
          max={100}
          color="military"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("state.technology")}
        </h3>
        <StatBar
          label={t("state.technology")}
          value={worldState.technology.level}
          max={100}
          color="technology"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("state.culture")}
        </h3>
        <StatBar
          label={t("state.culture")}
          value={worldState.culture.development}
          max={100}
          color="culture"
        />
      </div>

      <DeviationsList deviations={worldState.deviations} />
    </div>
  );
}
