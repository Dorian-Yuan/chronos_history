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
    <div className="border-t border-[#2A2A2E] bg-[#1A1A1E] px-6 py-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "下达指令...（外交、经济、军事等）"}
          aria-label="决策输入"
          rows={1}
          className="input-field flex-1 resize-none py-3 bg-[#141418] border-[#2A2A2E] placeholder:text-[#666666]"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2ECE8B] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all hover:bg-[#2ECE8B]/90"
          aria-label="发送决策"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
