import type { ScenarioConfig } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { Play, Calendar } from "lucide-react";

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
      className="group flex flex-col rounded-xl border border-border bg-bg-card p-5 text-left transition-all duration-300 hover:border-accent-primary/40 hover:bg-bg-hover hover:shadow-glow active:scale-[0.98]"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-serif text-lg font-semibold text-text-primary transition-colors group-hover:text-accent-primary">
          {name}
        </h3>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary text-text-tertiary transition-all group-hover:bg-accent-primary/15 group-hover:text-accent-primary">
          <Play size={15} />
        </div>
      </div>
      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      <div className="mt-auto flex items-center gap-2 text-xs text-text-tertiary">
        <Calendar size={12} />
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
