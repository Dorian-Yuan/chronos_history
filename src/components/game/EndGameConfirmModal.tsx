import { useEffect, useMemo, useRef } from "react";
import { X, AlertTriangle, Flag, Loader2 } from "lucide-react";
import type { GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";

interface EndGameConfirmModalProps {
  turnCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  universe?: GameUniverse;
  isLoading?: boolean;
}

export function EndGameConfirmModal({
  turnCount,
  onConfirm,
  onCancel,
  universe = "history",
  isLoading = false,
}: EndGameConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEarly = turnCount < 16;
  const term = useMemo(() => getTerminology(universe), [universe]);

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
            {term.endGameTitle}
          </h2>
          <button
            onClick={onCancel}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {isEarly ? (
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="shrink-0 text-accent-secondary mt-0.5"
              />
              <div className="space-y-2">
                <p className="text-sm font-serif text-text-primary">
                  {term.endGameEarlyHint}
                </p>
                <p className="text-xs font-serif text-text-tertiary">
                  {term.endGameEarlyConfirm.replace(
                    "{turn}",
                    String(turnCount),
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Flag size={20} className="shrink-0 text-accent-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-serif text-text-primary">
                  {term.endGameConfirm}
                </p>
                <p className="text-xs font-serif text-text-tertiary">
                  {term.endGameNormalConfirm.replace(
                    "{turn}",
                    String(turnCount),
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 max-w-[10rem] mx-0"
            disabled={isLoading}
          >
            {term.continueButton}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1 max-w-[10rem] mx-0 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {term.confirmEndButton}
          </button>
        </div>
      </div>
    </div>
  );
}
