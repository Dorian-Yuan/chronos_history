import { useTranslation } from "@/hooks/useTranslation";
import type { CharacterRelation } from "@/types";

interface CharacterNetworkProps {
  relations: CharacterRelation[];
}

const relationColors: Record<string, string> = {
  ally: "var(--color-accent-success)",
  rival: "var(--color-accent-danger)",
  subordinate: "var(--color-accent-info)",
  superior: "var(--color-accent-warning)",
  neutral: "var(--color-text-tertiary)",
};

export function CharacterNetwork({ relations }: CharacterNetworkProps) {
  const { t } = useTranslation();

  if (!relations.length) {
    return (
      <div className="p-4 text-center text-sm text-text-tertiary">
        {t("game.characterNetwork")} - {t("game.noData")}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-medium text-text-secondary">
        {t("game.characterNetwork")}
      </h3>
      <div className="space-y-1">
        {relations.map((rel, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded border border-border bg-bg-card p-2"
          >
            <span className="text-xs text-text-primary">
              {rel.characterName}
            </span>
            <span
              className="text-xs"
              style={{ color: relationColors[rel.relationType] }}
            >
              {t(`relation.${rel.relationType}`)}
            </span>
            <span className="text-xs text-text-primary">
              {rel.relatedToName}
            </span>
            <span className="text-xs text-text-tertiary ml-auto">
              {rel.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
