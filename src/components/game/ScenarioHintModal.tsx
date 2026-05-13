import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { PlayStyle, LifeMode, GameUniverse } from "@/types";
import { PLAY_STYLES, LIFE_MODES } from "@/types";
import { getTerminology } from "@/config/terminology";

interface ScenarioHintModalProps {
  playStyle: PlayStyle | LifeMode;
  onConfirm: (hint: string) => void;
  onCancel: () => void;
  universe?: GameUniverse;
}

export function ScenarioHintModal({
  playStyle,
  onConfirm,
  onCancel,
  universe = "history",
}: ScenarioHintModalProps) {
  const [hint, setHint] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const term = useMemo(() => getTerminology(universe), [universe]);

  const styleInfo =
    PLAY_STYLES.find((s) => s.id === playStyle) ||
    LIFE_MODES.find((s) => s.id === playStyle);

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
            {styleInfo?.name || term.defaultStyleName} ·{" "}
            {term.scenarioHintTitle}
          </h2>
        </div>

        <div className="modal-body space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            {term.scenarioHintDescription}
          </p>
          <textarea
            ref={textareaRef}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={term.scenarioHintPlaceholder}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-4 py-3 text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-primary/50"
          />
        </div>

        <div className="modal-footer flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 max-w-[10rem] mx-0"
          >
            {term.cancelButton}
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1 max-w-[10rem] mx-0"
          >
            {term.startButton}
          </button>
        </div>
      </div>
    </div>
  );
}
