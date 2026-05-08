import { useChatStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { AdvisorCard } from "./AdvisorCard";
import { AlertTriangle } from "lucide-react";
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
    <div className="border-t border-border bg-bg-secondary/50 px-4 py-4">
      <h3 className="font-serif text-sm font-medium text-text-secondary mb-3 decorative-line">
        {t("game.cabinetDebate")}
      </h3>
      {debate.conflicts?.length > 0 && (
        <div className="mb-3 rounded-xl border border-accent-warning/20 bg-accent-warning/8 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-accent-warning">
            <AlertTriangle size={12} />
            {t("game.opinionConflict")}
          </div>
          {debate.conflicts.map((conflict, i) => (
            <div key={i} className="text-xs text-text-secondary">
              {conflict}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {debate.opinions.map((opinion) => (
          <AdvisorCard key={opinion.advisor} opinion={opinion} />
        ))}
      </div>
    </div>
  );
}
