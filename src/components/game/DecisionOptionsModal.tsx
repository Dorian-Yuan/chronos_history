import { useState, useEffect, useRef } from "react";
import type { DecisionOption } from "@/types";
import { X, Check } from "lucide-react";

interface DecisionOptionsModalProps {
  options: DecisionOption[];
  onConfirm: (selectedTitles: string[]) => void;
  onCancel: () => void;
}

export function DecisionOptionsModal({
  options,
  onConfirm,
  onCancel,
}: DecisionOptionsModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  useEffect(() => {
    if (modalRef.current) {
      const firstFocusable =
        modalRef.current.querySelector<HTMLElement>("button, [tabindex]");
      firstFocusable?.focus();
    }
  }, []);

  const toggleOption = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedTitles = Array.from(selectedIndices)
      .sort()
      .map((i) => options[i].title);
    onConfirm(selectedTitles);
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div ref={modalRef} className="modal-content max-w-md">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            决策选择
          </h2>
          <button
            onClick={onCancel}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-3">
          <p className="text-xs text-text-tertiary font-serif">
            选择一项或多项决策方向，确认后将填入输入框
          </p>
          {options.map((option, index) => {
            const isSelected = selectedIndices.has(index);
            return (
              <button
                key={index}
                onClick={() => toggleOption(index)}
                className={`w-full text-left rounded-lg border-l-[3px] px-4 py-3 transition-all ${
                  isSelected
                    ? "border-l-accent-primary bg-accent-primary/5"
                    : "border-l-border bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-serif font-bold text-text-primary">
                        {option.title}
                      </span>
                      <span className="badge bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                        {option.recommended_advisor}荐
                      </span>
                    </div>
                    <p className="text-xs font-serif text-text-secondary leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/20">
                      <Check size={12} className="text-accent-primary" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-footer flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 max-w-[10rem] mx-0"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIndices.size === 0}
            className="btn-primary flex-1 max-w-[10rem] mx-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
