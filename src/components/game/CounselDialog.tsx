import { useState, useRef, useEffect, useCallback } from "react";
import type { AdvisorData, AdvisorRole, CounselMessage, ScenarioData, GameStats } from "@/types";
import { counselAdvisor } from "@/lib/game";
import { Shield, Scroll, Eye, BookOpen, Coins, MessageCircle, X, Send } from "lucide-react";

interface CounselDialogProps {
  advisor: AdvisorData;
  scenario: ScenarioData;
  stats: GameStats;
  historyLog: string[];
  currentSituation: string;
  onClose: () => void;
}

const ROLE_CONFIG: Record<AdvisorRole, { label: string; icon: typeof Shield; colorVar: string }> = {
  General: { label: "将军", icon: Shield, colorVar: "--color-role-general" },
  Diplomat: { label: "外交官", icon: Scroll, colorVar: "--color-role-diplomat" },
  Intel: { label: "密探", icon: Eye, colorVar: "--color-role-intel" },
  Scholar: { label: "学者", icon: BookOpen, colorVar: "--color-role-scholar" },
  Merchant: { label: "商人", icon: Coins, colorVar: "--color-role-merchant" },
};

export function CounselDialog({
  advisor,
  scenario,
  stats,
  historyLog,
  currentSituation,
  onClose,
}: CounselDialogProps) {
  const config = ROLE_CONFIG[advisor.role];
  const [messages, setMessages] = useState<CounselMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const roleColor = config ? `var(${config.colorVar})` : "#999";
  const Icon = config?.icon || MessageCircle;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: CounselMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await counselAdvisor(
        advisor,
        scenario,
        stats,
        historyLog,
        currentSituation,
        newMessages,
      );

      const assistantMessage: CounselMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      console.error("[CounselDialog] Failed to get response:", e);
      const errorMsg = e instanceof Error ? e.message : "问对失败";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, advisor, scenario, stats, historyLog, currentSituation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleOverlayClick}>
      <div ref={modalRef} className="modal-content max-w-lg flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="modal-header shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: `var(${config.colorVar}-bg, #1a1a1e)` }}
            >
              <Icon size={12} style={{ color: roleColor }} aria-hidden="true" />
            </div>
            <h2 className="font-serif text-sm font-semibold text-text-primary">
              {advisor.name} · {config?.label}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-secondary/10 text-accent-secondary font-serif">
              私下密谈
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body flex-1 overflow-y-auto min-h-0 space-y-3 py-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-text-tertiary">
              <MessageCircle size={24} className="mb-2 opacity-30" />
              <p className="text-xs font-serif">向{advisor.name}提出你的问题</p>
              <p className="text-[10px] mt-1 text-text-tertiary/60 font-serif">
                此番对话仅你与{advisor.name}知晓
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs font-serif leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent-primary/15 text-text-primary"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
                style={msg.role === "assistant" ? { borderLeft: `2px solid ${roleColor}` } : undefined}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="max-w-[80%] rounded-lg px-3 py-2 bg-bg-tertiary"
                style={{ borderLeft: `2px solid ${roleColor}` }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: roleColor }} />
                  <span className="text-[10px] text-text-tertiary font-serif">{advisor.name}正在低语...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-status-error-border bg-status-error-bg/50 px-3 py-2">
              <p className="text-[10px] text-status-error-text">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-border px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`向${advisor.name}提问...`}
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-md border border-border bg-bg-secondary px-3 py-2 text-xs font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
              style={{ maxHeight: "80px" }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="发送"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
