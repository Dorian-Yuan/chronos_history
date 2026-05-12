import { useEffect, useRef } from "react";
import { X, AlertTriangle, Flag } from "lucide-react";

interface EndGameConfirmModalProps {
  turnCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EndGameConfirmModal({
  turnCount,
  onConfirm,
  onCancel,
}: EndGameConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isEarly = turnCount < 16;

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
            结束推演
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
                  当前局势尚未明朗，建议继续推演以获得更完整的结局。
                </p>
                <p className="text-xs font-serif text-text-tertiary">
                  当前第{turnCount}回合，历史仍在书写中。确定要提前结束吗？
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Flag size={20} className="shrink-0 text-accent-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-serif text-text-primary">
                  确定要结束本次推演吗？
                </p>
                <p className="text-xs font-serif text-text-tertiary">
                  当前第{turnCount}回合，将生成终局分析报告。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer flex-row gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 max-w-[10rem] mx-0"
          >
            继续推演
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1 max-w-[10rem] mx-0"
          >
            确认结束
          </button>
        </div>
      </div>
    </div>
  );
}
