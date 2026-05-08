import { useTranslation } from "@/hooks/useTranslation";
import type { CausalNode } from "@/types";
import { ArrowRight } from "lucide-react";

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
      <h3 className="font-serif text-sm font-medium text-accent-primary decorative-line">
        {t("game.causalChain")}
      </h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-border-hover"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="font-mono text-[10px] text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded-lg">
                {node.year}
              </span>
              <ArrowRight size={10} className="text-text-tertiary" />
            </div>
            <div className="text-xs font-medium text-text-primary">
              {node.decision}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">
              {node.consequence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
