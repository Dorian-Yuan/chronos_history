import { useTranslation } from "@/hooks/useTranslation";
import { getScenarios } from "@/config";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioImport } from "./ScenarioImport";

interface ScenarioSelectProps {
  onSelectScenario: (scenarioId: string) => void;
}

export function ScenarioSelect({ onSelectScenario }: ScenarioSelectProps) {
  const { t } = useTranslation();
  const scenarios = getScenarios();

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            {t("app.title")}
          </h1>
          <p className="text-text-secondary text-lg">{t("app.subtitle")}</p>
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-6">
          {t("scenario.select")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={() => onSelectScenario(scenario.id)}
            />
          ))}
        </div>

        <div className="mt-8">
          <ScenarioImport />
        </div>
      </div>
    </div>
  );
}
