import type { ScenarioConfig } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { Play } from "lucide-react";

interface ScenarioCardProps {
  scenario: ScenarioConfig;
  onSelect: () => void;
}

export function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  const { t, locale } = useTranslation();
  const name = locale === "en" ? scenario.nameEn : scenario.name;
  const description =
    locale === "en" ? scenario.descriptionEn : scenario.description;

  return (
    <button
      onClick={onSelect}
      className="group flex flex-col rounded-xl border border-border bg-bg-card p-5 text-left hover:border-accent-primary/50 hover:bg-bg-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
          {name}
        </h3>
        <Play
          size={16}
          className="text-text-tertiary group-hover:text-accent-primary transition-colors"
        />
      </div>
      <p className="text-sm text-text-secondary mb-4 line-clamp-3">
        {description}
      </p>
      <div className="mt-auto flex items-center gap-2 text-xs text-text-tertiary">
        <span>
          {t("scenario.startYear")}:{" "}
          {scenario.startYear < 0
            ? `${Math.abs(scenario.startYear)} BC`
            : scenario.startYear}
        </span>
      </div>
    </button>
  );
}
