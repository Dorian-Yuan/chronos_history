import { useTranslation } from "@/hooks/useTranslation";
import { AlertTriangle } from "lucide-react";

interface DeviationsListProps {
  deviations: string[];
}

export function DeviationsList({ deviations }: DeviationsListProps) {
  const { t } = useTranslation();

  if (!deviations.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-xs font-semibold text-accent-warning flex items-center gap-1.5 decorative-line">
        <AlertTriangle size={12} className="text-accent-warning" />
        {t("game.deviations")}
      </h3>
      <div className="space-y-1">
        {deviations.map((deviation, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-xs text-text-secondary"
          >
            {deviation}
          </div>
        ))}
      </div>
    </div>
  );
}
