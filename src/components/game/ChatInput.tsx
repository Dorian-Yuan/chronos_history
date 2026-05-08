import { useState, useRef, useCallback, useEffect } from "react";
import { Send } from "lucide-react";
import { useChatStore, useSettingsStore, useWorldStateStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { SimulationEngine } from "@/lib/game";

export function ChatInput() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const worldState = useWorldStateStore((s) => s.worldState);
  const updateWorldState = useWorldStateStore((s) => s.updateWorldState);
  const aiProvider = useSettingsStore((s) => s.aiProvider);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: "user" as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInput("");
    setIsStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const aiMessageId = `msg_${Date.now() + 1}`;
    addMessage({
      id: aiMessageId,
      role: "ai",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    });

    try {
      if (!aiProvider || !worldState) {
        updateMessage(aiMessageId, {
          content: t("pwa.offlineNotice"),
          isStreaming: false,
        });
        setIsStreaming(false);
        return;
      }

      const engine = new SimulationEngine("");
      let fullContent = "";

      for await (const chunk of engine.streamSimulation(
        userMessage.content,
        worldState,
        [],
      )) {
        fullContent += chunk;
        appendToMessage(aiMessageId, chunk);
      }

      updateMessage(aiMessageId, { isStreaming: false });

      try {
        const parsed = JSON.parse(fullContent);
        if (parsed.worldStateUpdate) {
          updateWorldState(parsed.worldStateUpdate);
        }
      } catch (e) {
        console.debug("Failed to parse world state update:", e);
      }
    } catch (error) {
      updateMessage(aiMessageId, {
        content: `${t("common.error")}: ${error instanceof Error ? error.message : "Unknown error"}`,
        isStreaming: false,
      });
    } finally {
      setIsStreaming(false);
    }
  }, [
    input,
    isStreaming,
    addMessage,
    setIsStreaming,
    appendToMessage,
    updateMessage,
    worldState,
    updateWorldState,
    aiProvider,
    t,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-bg-secondary/80 px-4 py-3 safe-bottom backdrop-blur-md">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("game.inputPlaceholder")}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-bg-tertiary/80 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
          disabled={isStreaming}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isStreaming}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-text-inverse disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all hover:opacity-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
