import { useEffect, useRef } from "react";
import type { ScenarioData, TurnResult } from "@/types";

interface ChroniclePanelProps {
  scenario: ScenarioData;
  turnCount: number;
  turnResults: TurnResult[];
  isLoading: boolean;
}

export function ChroniclePanel({
  scenario,
  turnCount,
  turnResults,
  isLoading,
}: ChroniclePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turnResults, isLoading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-5 py-4"
      role="log"
      aria-label="编年史"
      aria-live="polite"
    >
      <div className="rounded-lg border border-border bg-bg-card p-5">
        {turnCount === 1 && turnResults.length === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="section-label">{scenario.start_date || "元年"}</div>

            {scenario.player_context?.nation_name && (
              <div className="flex items-center gap-2">
                <span className="text-base font-serif font-bold text-text-primary">
                  {scenario.player_context.nation_name}
                </span>
                {scenario.player_context?.leader_title && (
                  <span className="text-xs text-text-tertiary">
                    — {scenario.player_context.leader_title}
                  </span>
                )}
              </div>
            )}

            {scenario.player_context?.background_summary && (
              <div className="text-sm font-serif leading-relaxed text-text-secondary">
                {scenario.player_context.background_summary}
              </div>
            )}

            {scenario.description && (
              <div className="border-l-[3px] border-accent-primary bg-accent-primary/5 px-4 py-3 rounded-r-lg my-4">
                <div className="text-xs font-semibold text-accent-primary tracking-wider uppercase mb-1">
                  当前危机
                </div>
                <div className="font-serif text-sm text-accent-primary leading-relaxed">
                  {scenario.description}
                </div>
              </div>
            )}

            <div className="h-px bg-border my-4" />

            <div className="border-l-[3px] border-accent-primary pl-3">
              <div className="font-serif text-sm text-text-secondary leading-relaxed">
                阁下，作为{scenario.player_context?.leader_title || "统治者"}
                ，您的第一道政令是什么？
              </div>
            </div>
          </div>
        )}

        {turnResults.map((result, idx) => (
          <article key={idx} className="mb-6 space-y-4">
            <div className="section-label">{result.date_display}</div>

            <div className="text-lg font-serif font-bold text-text-primary leading-snug">
              {result.headline}
            </div>

            {result.rumor && (
              <div className="font-serif text-xs italic text-text-tertiary leading-relaxed">
                民间传言：{result.rumor}
              </div>
            )}

            <div className="border-l-[3px] border-border pl-4">
              <div className="font-serif text-sm leading-relaxed text-text-secondary">
                {result.narrative}
              </div>
            </div>

            {result.situation_update && (
              <div className="border-l-[3px] border-accent-primary bg-accent-primary/5 px-4 py-3 rounded-r-lg my-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-accent-primary mb-1">
                  最新情报
                </div>
                <div className="font-serif text-sm text-accent-primary leading-relaxed">
                  {result.situation_update}
                </div>
              </div>
            )}

            {idx < turnResults.length - 1 && (
              <div className="h-px bg-border my-4" />
            )}
          </article>
        ))}

        {isLoading && (
          <div
            className="flex items-center gap-2 py-4"
            role="status"
            aria-live="polite"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-primary" />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.4s" }}
            />
            <span className="text-xs text-text-tertiary ml-2">推演中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
