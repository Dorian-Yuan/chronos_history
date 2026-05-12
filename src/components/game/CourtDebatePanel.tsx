import { useState, useRef, useEffect, useCallback } from "react";
import type {
  AdvisorData,
  AdvisorRole,
  CourtDebateMessage,
  CourtDebateSession,
  ScenarioData,
  GameStats,
  TurnResult,
} from "@/types";
import { useGameDispatch, courtDebate } from "@/lib/game";
import {
  Shield,
  Scroll,
  Eye,
  BookOpen,
  Coins,
  Send,
  MessageCircle,
} from "lucide-react";

interface CourtDebatePanelProps {
  scenario: ScenarioData;
  stats: GameStats;
  historyLog: string[];
  currentSituation: string;
  turnCount: number;
  turnResults: TurnResult[];
  advisors: AdvisorData[];
  courtDebateSession: CourtDebateSession | null;
}

const ROLE_CONFIG: Record<
  AdvisorRole,
  { label: string; icon: typeof Shield; colorVar: string }
> = {
  General: { label: "将军", icon: Shield, colorVar: "--color-role-general" },
  Diplomat: {
    label: "外交官",
    icon: Scroll,
    colorVar: "--color-role-diplomat",
  },
  Intel: { label: "密探", icon: Eye, colorVar: "--color-role-intel" },
  Scholar: { label: "学者", icon: BookOpen, colorVar: "--color-role-scholar" },
  Merchant: { label: "商人", icon: Coins, colorVar: "--color-role-merchant" },
};

const STANCE_CONFIG: Record<
  string,
  { label: string; colorClass: string; bgColorClass: string }
> = {
  support: {
    label: "支持",
    colorClass: "text-accent-primary",
    bgColorClass: "bg-accent-primary/10",
  },
  oppose: {
    label: "驳斥",
    colorClass: "text-accent-danger",
    bgColorClass: "bg-accent-danger/10",
  },
  supplement: {
    label: "补充",
    colorClass: "text-accent-info",
    bgColorClass: "bg-accent-info/10",
  },
};

export function CourtDebatePanel({
  scenario,
  stats,
  historyLog,
  currentSituation,
  turnCount,
  turnResults,
  advisors,
  courtDebateSession,
}: CourtDebatePanelProps) {
  const dispatch = useGameDispatch();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentDateDisplay =
    turnResults.length > 0
      ? turnResults[turnResults.length - 1].date_display
      : scenario.start_date;

  const isDebating =
    courtDebateSession !== null && !courtDebateSession.isFinished;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [courtDebateSession?.messages, isLoading]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    const totalRounds = Math.floor(Math.random() * 3) + 3;

    dispatch({ type: "START_COURT_DEBATE", topic: trimmed, totalRounds });

    const userMessage: CourtDebateMessage = {
      role: "user",
      content: trimmed,
    };
    dispatch({ type: "ADD_COURT_DEBATE_MESSAGE", message: userMessage });

    const localMessages: CourtDebateMessage[] = [userMessage];

    setInput("");

    try {
      for (let round = 0; round < totalRounds; round++) {
        const remainingRounds = totalRounds - round;
        const result = await courtDebate(
          trimmed,
          scenario,
          stats,
          historyLog,
          currentSituation,
          currentDateDisplay,
          advisors,
          localMessages,
          remainingRounds,
        );

        const advisorMessage: CourtDebateMessage = {
          role: "advisor",
          advisorRole: result.speaker_role,
          advisorName: result.speaker_name,
          content: result.content,
          stance: result.stance,
        };

        localMessages.push(advisorMessage);

        dispatch({
          type: "ADD_COURT_DEBATE_MESSAGE",
          message: advisorMessage,
        });
        dispatch({ type: "ADVANCE_COURT_DEBATE_ROUND" });
      }

      dispatch({ type: "FINISH_COURT_DEBATE" });
    } catch (e) {
      console.error("[CourtDebatePanel] Debate failed:", e);
      const msg = e instanceof Error ? e.message : "廷议失败";
      setError(msg);
      dispatch({ type: "FINISH_COURT_DEBATE" });
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    scenario,
    stats,
    historyLog,
    currentSituation,
    currentDateDisplay,
    advisors,
    dispatch,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const messages = courtDebateSession?.messages ?? [];
  const currentRound = courtDebateSession?.currentRound ?? 0;
  const totalRounds = courtDebateSession?.totalRounds ?? 0;

  const getRoleColor = (role?: AdvisorRole) => {
    if (!role) return "var(--color-text-tertiary)";
    const config = ROLE_CONFIG[role];
    return config ? `var(${config.colorVar})` : "var(--color-text-tertiary)";
  };

  const getRoleLabel = (role?: AdvisorRole) => {
    if (!role) return "";
    const config = ROLE_CONFIG[role];
    return config?.label ?? role;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="section-label">
        第{turnCount}回合 · {currentDateDisplay}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0" ref={scrollRef}>
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
            <MessageCircle size={24} className="mb-2 opacity-30" />
            <p className="text-xs font-serif">
              {scenario.player_context?.leader_title || "阁下"}
              ，可在朝堂上提出议题，令群臣廷议
            </p>
            <p className="text-[10px] mt-1 text-text-tertiary/60 font-serif">
              廷议结果仅供决策参考
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.role === "user") {
            return (
              <div key={index} className="flex justify-end mb-3">
                <div className="max-w-[80%] rounded-lg text-xs font-serif leading-relaxed bg-accent-primary/15 text-text-primary px-3 py-2">
                  {msg.content}
                </div>
              </div>
            );
          }

          const roleColor = getRoleColor(msg.advisorRole);
          const roleLabel = getRoleLabel(msg.advisorRole);
          const stanceConfig = msg.stance ? STANCE_CONFIG[msg.stance] : null;

          return (
            <div key={index} className="flex justify-start mb-3">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-serif font-semibold"
                    style={{ color: roleColor }}
                  >
                    {roleLabel}
                  </span>
                  <span
                    className="text-[10px] font-serif"
                    style={{ color: roleColor }}
                  >
                    // {msg.advisorName}
                  </span>
                  {stanceConfig && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-serif ${stanceConfig.bgColorClass} ${stanceConfig.colorClass}`}
                    >
                      {stanceConfig.label}
                    </span>
                  )}
                </div>
                <div
                  className="rounded-lg text-xs font-serif leading-relaxed bg-bg-tertiary text-text-secondary px-3 py-2"
                  style={{ borderLeft: `3px solid ${roleColor}` }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && courtDebateSession && !courtDebateSession.isFinished && (
          <div className="flex justify-start items-center gap-2 mb-3">
            <div className="rounded-lg px-3 py-2 bg-bg-tertiary">
              <span className="text-[10px] text-text-tertiary font-serif">
                {currentRound > 0 ? "群臣商议中..." : "群臣准备陈词..."}
              </span>
            </div>
            <div
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{
                backgroundColor: "var(--color-tab-court-debate, #c9a84c)",
              }}
            />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 mb-3">
            <p className="text-[10px] text-status-error-text">{error}</p>
          </div>
        )}
      </div>

      {courtDebateSession && !courtDebateSession.isFinished && (
        <div className="px-5 py-1">
          <div className="text-[10px] text-text-tertiary font-serif text-center">
            廷议进行中 · 第{currentRound}/{totalRounds}轮
          </div>
        </div>
      )}

      {courtDebateSession?.isFinished && (
        <div className="px-5 py-1">
          <div className="text-[10px] text-accent-primary font-serif text-center">
            廷议已结束 · 共{totalRounds}轮
          </div>
        </div>
      )}

      <div
        style={{
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          paddingBottom: "0.5rem",
          paddingTop: "0.25rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div className="flex items-end gap-2.5">
          <div
            className="flex items-center rounded-[var(--radius-md)] border border-border bg-bg-card shadow-sm px-3 py-1.5 focus-within:border-accent-primary/50 focus-within:shadow-glow transition-all"
            style={{
              minHeight: "2.25rem",
              flex: "1 1 0%",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDebating ? "廷议进行中..." : "提出议题..."}
              aria-label="廷议输入"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none leading-relaxed"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              disabled={isLoading || isDebating}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isDebating}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-accent-primary text-text-inverse disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-primary/90"
            aria-label="发起廷议"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
