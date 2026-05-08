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

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "输入您的决策..."}
          aria-label="决策输入"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all hover:bg-amber-500"
          aria-label="发送决策"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
