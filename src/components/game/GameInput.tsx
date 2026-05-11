import { useState, useRef, useCallback, useEffect } from "react";
import { Send } from "lucide-react";

interface GameInputProps {
  onSubmit: (action: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function GameInput({ onSubmit, disabled, placeholder }: GameInputProps) {
  const [input, setInput] = useState("");
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

  return (
    <div className="px-5 pb-4 pt-1">
      <div className="flex items-center gap-2.5 rounded-[var(--radius-xl)] border border-border bg-bg-card shadow-sm pl-4 pr-1.5 py-1.5 focus-within:border-accent-primary/50 focus-within:shadow-glow transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "下达指令..."}
          aria-label="决策输入"
          rows={1}
          className="flex-1 resize-none bg-transparent py-1.5 pl-2 text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-primary text-text-inverse disabled:opacity-20 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-primary/90"
          aria-label="发送决策"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
