import { useMemo } from "react";
import { useChatStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { Lightbulb } from "lucide-react";

export function SuggestedActions() {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");

  const actions = useMemo(() => {
    if (!lastAiMessage || isStreaming) return [];
    try {
      const parsed = JSON.parse(lastAiMessage.content);
      if (parsed.suggestedActions && Array.isArray(parsed.suggestedActions)) {
        return parsed.suggestedActions as string[];
      }
    } catch (e) {
      console.debug("Failed to parse suggested actions:", e);
    }
    return [];
  }, [lastAiMessage, isStreaming]);

  if (actions.length === 0) return null;

  return (
    <div className="border-t border-border bg-bg-secondary/30 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb size={13} className="text-accent-warning" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          {t("game.suggestedActions")}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, i) => (
          <button
            key={i}
            className="rounded-lg border border-border bg-bg-tertiary/60 px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-accent-primary/40 hover:text-text-primary hover:bg-accent-primary/8 active:scale-95"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
