import { useState, useRef, useEffect, useCallback } from "react";
import type { PlayStyle } from "@/types";
import { PLAY_STYLES } from "@/types";

interface ScenarioHintModalProps {
  playStyle: PlayStyle;
  onConfirm: (hint: string) => void;
  onCancel: () => void;
}

export function ScenarioHintModal({
  playStyle,
  onConfirm,
  onCancel,
}: ScenarioHintModalProps) {
  const [hint, setHint] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const styleInfo = PLAY_STYLES.find((s) => s.id === playStyle);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  const handleSubmit = useCallback(() => {
    onConfirm(hint.trim());
  }, [hint, onConfirm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div ref={modalRef} className="modal-content max-w-md">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            {styleInfo?.name || "自定义剧本"} · 设定愿景
          </h2>
        </div>

        <div className="modal-body space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            您可以描述期望的文明、年代、身份和大致剧情，AI将重点参考您的愿景生成剧本。留空则由AI随机生成。
          </p>
          <textarea
            ref={textareaRef}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：战国末期秦国、大航海时代的葡萄牙、文艺复兴威尼斯商人..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-4 py-3 text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-primary/50"
          />
        </div>

        <div className="modal-footer flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 max-w-[10rem] mx-0"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1 max-w-[10rem] mx-0"
          >
            开始推演
          </button>
        </div>
      </div>
    </div>
  );
}
