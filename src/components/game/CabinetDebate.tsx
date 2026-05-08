import { useChatStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { AdvisorCard } from "./AdvisorCard";
import type { CabinetDebate as CabinetDebateType } from "@/types";

export function CabinetDebate() {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");
  if (!lastAiMessage || isStreaming) return null;

  let debate: CabinetDebateType | null = null;
  try {
    const parsed = JSON.parse(lastAiMessage.content);
    debate = parsed.cabinetDebate;
  } catch (e) {
    console.debug("Failed to parse cabinet debate:", e);
  }

  if (!debate || !debate.opinions?.length) return null;

  return (
    <div className="border-t border-border bg-bg-secondary px-4 py-3">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        {t("game.cabinetDebate")}
      </h3>
      {debate.conflicts?.length > 0 && (
        <div className="mb-3 rounded-lg border border-accent-warning/30 bg-accent-warning/10 px-3 py-2">
          <div className="text-xs text-accent-warning font-medium mb-1">
            {t("game.opinionConflict")}
          </div>
          {debate.conflicts.map((conflict, i) => (
            <div key={i} className="text-xs text-text-secondary">
              {conflict}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {debate.opinions.map((opinion) => (
          <AdvisorCard key={opinion.advisor} opinion={opinion} />
        ))}
      </div>
    </div>
  );
}
