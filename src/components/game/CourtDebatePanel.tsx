import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type {
  AdvisorData,
  AdvisorRole,
  CourtDebateMessage,
  CourtDebateSession,
  ScenarioData,
  GameStats,
  TurnResult,
  GameUniverse,
} from "@/types";
import { useGameDispatch, courtDebate } from "@/lib/game";
import { getTerminology } from "@/config/terminology";
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
  courtDebateSessions: CourtDebateSession[];
  universe?: GameUniverse;
  visible?: boolean;
}

const ROLE_STATIC: Record<
  AdvisorRole,
  { icon: typeof Shield; colorVar: string }
> = {
  General: { icon: Shield, colorVar: "--color-role-general" },
  Diplomat: { icon: Scroll, colorVar: "--color-role-diplomat" },
  Intel: { icon: Eye, colorVar: "--color-role-intel" },
  Scholar: { icon: BookOpen, colorVar: "--color-role-scholar" },
  Merchant: { icon: Coins, colorVar: "--color-role-merchant" },
};

const STANCE_STYLE: Record<
  string,
  { colorClass: string; bgColorClass: string }
> = {
  support: {
    colorClass: "text-accent-primary",
    bgColorClass: "bg-accent-primary/10",
  },
  oppose: {
    colorClass: "text-accent-danger",
    bgColorClass: "bg-accent-danger/10",
  },
  supplement: {
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
  courtDebateSessions,
  universe = "history",
  visible = true,
}: CourtDebatePanelProps) {
  const dispatch = useGameDispatch();
  const term = useMemo(() => getTerminology(universe), [universe]);

  const roleConfig = useMemo(() => {
    const cfg = {} as Record<
      AdvisorRole,
      { label: string; icon: typeof Shield; colorVar: string }
    >;
    for (const role of Object.keys(ROLE_STATIC) as AdvisorRole[]) {
      cfg[role] = { ...ROLE_STATIC[role], label: term.advisorRoles[role] };
    }
    return cfg;
  }, [term]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentDateDisplay =
    turnResults.length > 0
      ? turnResults[turnResults.length - 1].date_display
      : scenario.start_date;

  const activeSession =
    courtDebateSessions.length > 0
      ? courtDebateSessions[courtDebateSessions.length - 1]
      : null;

  const isDebating = activeSession !== null && !activeSession.isFinished;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      if (textarea.scrollHeight > 0) {
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, isDebating, adjustHeight]);

  useEffect(() => {
    if (visible) {
      // Small delay to ensure the display: none has been removed
      const timer = setTimeout(adjustHeight, 10);
      return () => clearTimeout(timer);
    }
  }, [visible, adjustHeight]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [courtDebateSessions, isLoading]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    const totalRounds = Math.floor(Math.random() * 3) + 3;

    dispatch({
      type: "START_COURT_DEBATE",
      topic: trimmed,
      totalRounds,
      turnNumber: turnCount,
    });

    const userMessage: CourtDebateMessage = {
      role: "user",
      content: trimmed,
    };
    dispatch({ type: "ADD_COURT_DEBATE_MESSAGE", message: userMessage });

    const localMessages: CourtDebateMessage[] = [userMessage];

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
          [...localMessages],
          remainingRounds,
          universe,
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
      const msg = e instanceof Error ? e.message : term.debateError;
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
    turnCount,
    universe,
    term,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getRoleColor = (role?: AdvisorRole) => {
    if (!role) return "var(--color-text-tertiary)";
    const config = roleConfig[role];
    return config ? `var(${config.colorVar})` : "var(--color-text-tertiary)";
  };

  const getRoleLabel = (role?: AdvisorRole) => {
    if (!role) return "";
    const config = roleConfig[role];
    return config?.label ?? role;
  };

  const renderMessages = (messages: CourtDebateMessage[]) => {
    return messages.map((msg, index) => {
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
      const stanceStyle = msg.stance ? STANCE_STYLE[msg.stance] : null;

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
                {msg.advisorName}
              </span>
              {stanceStyle && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-serif ${stanceStyle.bgColorClass} ${stanceStyle.colorClass}`}
                >
                  {
                    term.stanceLabels[
                      msg.stance as keyof typeof term.stanceLabels
                    ]
                  }
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
    });
  };

  const hasAnyContent = courtDebateSessions.length > 0 || isLoading;

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingTop: "0.5rem",
        paddingBottom: 0,
      }}
    >
      <div className="rounded-lg border border-border bg-bg-card flex-1 flex flex-col min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
          role="log"
          aria-label={term.courtDebateLabel}
          aria-live="polite"
        >
          {!hasAnyContent && (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <MessageCircle size={24} className="mb-2 opacity-30" />
              <p className="text-xs font-serif">
                {term.debateEmptyPrompt
                  .replace(
                    "{court_term}",
                    scenario.player_context?.court_term ||
                      term.defaultCourtTerm,
                  )
                  .replace(
                    "{ministers_term}",
                    scenario.player_context?.ministers_term ||
                      term.defaultMinistersTerm,
                  )
                  .replace(
                    "{title}",
                    scenario.player_context?.leader_title ||
                      term.defaultLeaderTitle,
                  )}
              </p>
              <p className="text-[10px] mt-1 text-text-tertiary/60 font-serif">
                {term.debateResultHint}
              </p>
            </div>
          )}

          {courtDebateSessions.map((session, sessionIdx) => {
            const isLast = sessionIdx === courtDebateSessions.length - 1;
            const turnDate =
              turnResults.length > 0 && session.turnNumber <= turnResults.length
                ? (turnResults[session.turnNumber - 1]?.date_display ??
                  currentDateDisplay)
                : currentDateDisplay;

            return (
              <div key={sessionIdx}>
                <div className="section-label">
                  第{session.turnNumber}回合 · {turnDate}
                  {courtDebateSessions.length > 1 &&
                    ` · ${term.courtDebateLabel}${sessionIdx + 1}`}
                </div>

                {session.topic && (
                  <div className="flex justify-end mb-3">
                    <div className="max-w-[80%] rounded-lg text-xs font-serif leading-relaxed bg-accent-primary/15 text-text-primary px-3 py-2">
                      {session.topic}
                    </div>
                  </div>
                )}

                {renderMessages(
                  session.messages.filter((m) => m.role !== "user"),
                )}

                {isLoading && isLast && !session.isFinished && (
                  <div className="flex justify-start items-center gap-2 mb-3">
                    <div className="rounded-lg px-3 py-2 bg-bg-tertiary">
                      <span className="text-[10px] text-text-tertiary font-serif">
                        {session.currentRound > 0
                          ? term.debateDiscussing.replace(
                              "{ministers_term}",
                              scenario.player_context?.ministers_term ||
                                term.defaultMinistersTerm,
                            )
                          : term.debatePreparing.replace(
                              "{ministers_term}",
                              scenario.player_context?.ministers_term ||
                                term.defaultMinistersTerm,
                            )}
                      </span>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full animate-pulse shrink-0"
                      style={{
                        backgroundColor:
                          "var(--color-tab-court-debate, #c9a84c)",
                      }}
                    />
                  </div>
                )}

                {session.isFinished && (
                  <div className="text-[10px] text-accent-primary font-serif text-center mb-2">
                    {term.debateFinished.replace(
                      "{rounds}",
                      String(session.totalRounds),
                    )}
                  </div>
                )}

                {!isLast && <div className="h-px bg-border my-4" />}
              </div>
            );
          })}

          {error && (
            <div className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 mb-3">
              <p className="text-[10px] text-status-error-text">{error}</p>
            </div>
          )}
        </div>

        {isDebating && activeSession && (
          <div className="px-4 py-1 border-t border-border/50">
            <div className="text-[10px] text-text-tertiary font-serif text-center">
              {term.debateInProgress
                .replace("{current}", String(activeSession.currentRound))
                .replace("{total}", String(activeSession.totalRounds))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: "0.5rem",
          paddingTop: "0.5rem",
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
              placeholder={
                isDebating
                  ? term.debateInProgressShort
                  : term.debateInputPlaceholder
              }
              aria-label={`${term.courtDebateLabel}输入`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm font-serif text-text-primary placeholder:text-text-tertiary/50 focus:outline-none leading-relaxed"
              style={{
                minHeight: "1.5rem",
                maxHeight: "120px",
                overflowY: "auto",
              }}
              disabled={isLoading || isDebating}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isDebating}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-accent-primary text-text-inverse disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all hover:bg-accent-primary/90"
            aria-label={term.debateSubmitLabel}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
