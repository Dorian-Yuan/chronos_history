import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Lightbulb } from "lucide-react";
import type { DecisionOption } from "@/types";
import { DecisionOptionsModal } from "./DecisionOptionsModal";

interface GameInputProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
  placeholder?: string;
  decisionOptions: DecisionOption[];
}

export function GameInput({
  onSubmit,
  disabled,
  placeholder,
  decisionOptions,
}: GameInputProps) {
  const [input, setInput] = useState("");
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
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
    <div className="px-5">
      <div className="flex items-center gap-2.5">
        {hasDecisionOptions && (
          <button
            onClick={() => setShowDecisionModal(true)}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-secondary text-text-inverse disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-secondary/90"
            aria-label="决策选择"
          >
            <Lightbulb size={15} />
          </button>
        )}

        <div className="flex-1 flex items-center rounded-[var(--radius-xl)] border border-border bg-bg-card shadow-sm pl-4 pr-2 py-1.5 focus-within:border-accent-primary/50 focus-within:shadow-glow transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "下达指令..."}
            aria-label="决策输入"
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 pl-1 text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none"
            disabled={disabled}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-primary text-text-inverse disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-primary/90"
          aria-label="发送决策"
        >
          <Send size={15} />
        </button>
      </div>

      {showDecisionModal && hasDecisionOptions && (
        <DecisionOptionsModal
          options={decisionOptions}
          onConfirm={handleDecisionConfirm}
          onCancel={() => setShowDecisionModal(false)}
        />
      )}
    </div>
  );
}
