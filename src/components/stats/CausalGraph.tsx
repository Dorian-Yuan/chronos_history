import { useTranslation } from "@/hooks/useTranslation";
import type { CausalNode } from "@/types";

interface CausalGraphProps {
  nodes: CausalNode[];
}

export function CausalGraph({ nodes }: CausalGraphProps) {
  const { t } = useTranslation();

  if (!nodes.length) {
    return (
      <div className="p-4 text-center text-sm text-text-tertiary">
        {t("game.causalChain")} - {t("game.noData")}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-medium text-text-secondary">
        {t("game.causalChain")}
      </h3>
      <div className="space-y-1">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="rounded border border-border bg-bg-card p-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-accent-primary">
                {node.year}
              </span>
              <span className="text-xs text-text-secondary">→</span>
            </div>
            <div className="text-xs text-text-primary">{node.decision}</div>
            <div className="text-xs text-text-tertiary mt-0.5">
              {node.consequence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
