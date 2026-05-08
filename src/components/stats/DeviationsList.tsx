import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface DeviationsListProps {
  deviations: string[];
}

export function DeviationsList({ deviations }: DeviationsListProps) {
  const { t } = useTranslation();

  if (!deviations.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
        <AlertTriangle size={14} className="text-accent-warning" />
        {t("game.deviations")}
      </h3>
      <div className="space-y-1">
        {deviations.map((deviation, i) => (
          <div
            key={i}
            className="rounded border border-border bg-bg-card px-3 py-1.5 text-xs text-text-secondary"
          >
            {deviation}
          </div>
        ))}
      </div>
    </div>
  );
}
