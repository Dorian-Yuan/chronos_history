import type { AdvisorOpinion } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { Landmark, Shield, Globe, Users } from "lucide-react";

interface AdvisorCardProps {
  opinion: AdvisorOpinion;
}

const roleConfig: Record<string, { color: string; icon: typeof Landmark }> = {
  economist: { color: "var(--color-economy)", icon: Landmark },
  military: { color: "var(--color-military)", icon: Shield },
  diplomat: { color: "var(--color-diplomacy)", icon: Globe },
  public_sentiment: { color: "var(--color-culture)", icon: Users },
};

export function AdvisorCard({ opinion }: AdvisorCardProps) {
  const { t } = useTranslation();
  const config = roleConfig[opinion.advisor] || {
    color: "var(--color-accent-primary)",
    icon: Landmark,
  };
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-border-hover">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
            }}
          >
            <Icon size={14} />
          </div>
          <span className="text-xs font-medium" style={{ color: config.color }}>
            {t(`advisor.${opinion.advisor}`)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-14 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${opinion.confidence}%`,
                backgroundColor: config.color,
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-text-tertiary">
            {opinion.confidence}%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {t("advisor.intervention")}
          </span>
          <p className="text-xs text-text-primary">{opinion.intervention}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {t("advisor.reasoning")}
          </span>
          <p className="text-xs text-text-secondary">{opinion.reasoning}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {t("advisor.riskAssessment")}
          </span>
          <p className="text-xs text-accent-warning">
            {opinion.riskAssessment}
          </p>
        </div>
      </div>
    </div>
  );
}
