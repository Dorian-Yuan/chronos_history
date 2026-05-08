import type { AdvisorOpinion } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface AdvisorCardProps {
  opinion: AdvisorOpinion;
}

const roleColors: Record<string, string> = {
  economist: "var(--color-economy)",
  military: "var(--color-military)",
  diplomat: "var(--color-diplomacy)",
  public_sentiment: "var(--color-culture)",
};

export function AdvisorCard({ opinion }: AdvisorCardProps) {
  const { t } = useTranslation();
  const color = roleColors[opinion.advisor] || "var(--color-accent-primary)";

  return (
    <div className="rounded-lg border border-border bg-bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color }}>
          {t(`advisor.${opinion.advisor}`)}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-tertiary">
            {t("advisor.confidence")}
          </span>
          <div className="h-1.5 w-16 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${opinion.confidence}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="text-xs text-text-tertiary">
            {opinion.confidence}%
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div>
          <span className="text-xs text-text-tertiary">
            {t("advisor.intervention")}:{" "}
          </span>
          <span className="text-xs text-text-primary">
            {opinion.intervention}
          </span>
        </div>
        <div>
          <span className="text-xs text-text-tertiary">
            {t("advisor.reasoning")}:{" "}
          </span>
          <span className="text-xs text-text-secondary">
            {opinion.reasoning}
          </span>
        </div>
        <div>
          <span className="text-xs text-text-tertiary">
            {t("advisor.riskAssessment")}:{" "}
          </span>
          <span className="text-xs text-accent-warning">
            {opinion.riskAssessment}
          </span>
        </div>
      </div>
    </div>
  );
}
