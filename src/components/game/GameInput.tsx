import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Send, Lightbulb } from "lucide-react";
import type { DecisionOption, GameUniverse } from "@/types";
import { DecisionOptionsModal } from "./DecisionOptionsModal";
import { getTerminology } from "@/config/terminology";

interface GameInputProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
  placeholder?: string;
  decisionOptions: DecisionOption[];
  universe?: GameUniverse;
}

export function GameInput({
  onSubmit,
  disabled,
  placeholder,
  decisionOptions,
  universe = "history",
}: GameInputProps) {
  const [input, setInput] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const term = useMemo(() => getTerminology(universe), [universe]);

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

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled) return;
    onSubmit(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDecisionConfirm = useCallback(
    (selectedItems: { title: string; description: string }[]) => {
      const newText = selectedItems
        .map((item) => `${item.title}：${item.description}`)
        .join("；");
      setInput((prev) => {
        const combined = prev.trim() ? `${prev.trim()}；${newText}` : newText;
        return combined;
      });
      setShowDecisionModal(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    [],
  );

  const hasDecisionOptions = decisionOptions.length > 0;

  return (
    <div
      style={{
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingBottom: "0.5rem",
        paddingTop: "0.5rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        className="flex items-end gap-2.5"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "0.625rem",
          width: "100%",
        }}
      >
        {hasDecisionOptions && (
          <button
            onClick={() => setShowDecisionModal(true)}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-secondary text-text-inverse disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-secondary/90"
            aria-label={term.decisionSelectTitle}
            style={{ width: "2.25rem", height: "2.25rem", flexShrink: 0 }}
          >
            <Lightbulb size={15} />
          </button>
        )}

        <div
          className="flex items-center rounded-[var(--radius-md)] border border-border bg-bg-card shadow-sm px-3 py-1.5 focus-within:border-accent-primary/50 focus-within:shadow-glow transition-all"
          style={{
            minHeight: "2.25rem",
            flex: "1 1 0%",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "下达指令..."}
            aria-label={term.inputAriaLabel}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            disabled={disabled}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-primary text-text-inverse disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-primary/90 self-end"
          aria-label={term.sendAriaLabel}
          style={{ width: "2.25rem", height: "2.25rem", flexShrink: 0 }}
        >
          <Send size={15} />
        </button>
      </div>

      {showDecisionModal && hasDecisionOptions && (
        <DecisionOptionsModal
          options={decisionOptions}
          onConfirm={handleDecisionConfirm}
          onCancel={() => setShowDecisionModal(false)}
          universe={universe}
        />
      )}
    </div>
  );
}
