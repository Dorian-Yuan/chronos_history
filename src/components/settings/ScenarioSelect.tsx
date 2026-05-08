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
    <div className="flex min-h-full items-center justify-center p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 border border-accent-primary/20">
            <span className="font-serif text-2xl font-bold text-accent-primary">
              史
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-text-primary md:text-4xl">
            {t("app.title")}
          </h1>
          <p className="mt-3 text-text-secondary">{t("app.subtitle")}</p>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />
        </div>

        <h2
          className="font-serif text-xl font-semibold text-text-primary mb-6 decorative-line animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {t("scenario.select")}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario, i) => (
            <div
              key={scenario.id}
              className="animate-slide-up"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <ScenarioCard
                scenario={scenario}
                onSelect={() => onSelectScenario(scenario.id)}
              />
            </div>
          ))}
        </div>

        <div
          className="mt-8 animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <ScenarioImport />
        </div>
      </div>
    </div>
  );
}
