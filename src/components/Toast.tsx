import { useUIStore } from "@/stores";
import { Check, AlertCircle, Info, X } from "lucide-react";

const TOAST_STYLES = {
  success: {
    bg: "bg-status-success-bg",
    border: "border-status-success-border",
    text: "text-status-success-text",
    icon: Check,
  },
  error: {
    bg: "bg-status-error-bg",
    border: "border-status-error-border",
    text: "text-status-error-text",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-status-info-bg",
    border: "border-status-info-border",
    text: "text-status-info-text",
    icon: Info,
  },
} as const;

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const hideToast = useUIStore((s) => s.hideToast);

  if (!toast) return null;

  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[var(--z-toast)] animate-slide-down"
      role="alert"
    >
      <div
        className={`flex items-center gap-2.5 rounded-[var(--radius-lg)] border ${style.border} ${style.bg} px-4 py-2.5 text-xs ${style.text} shadow-md`}
      >
        <Icon size={14} />
        <span>{toast.message}</span>
        <button
          onClick={hideToast}
          className={`ml-1 opacity-50 hover:opacity-100 transition-opacity`}
          aria-label="关闭通知"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
