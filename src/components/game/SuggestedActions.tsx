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
    <div className="border-t border-border bg-bg-secondary px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={14} className="text-accent-warning" />
        <span className="text-xs text-text-secondary">
          {t("game.suggestedActions")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => (
          <button
            key={i}
            className="rounded-full border border-border bg-bg-tertiary px-3 py-1 text-xs text-text-secondary hover:text-text-primary hover:border-accent-primary transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
