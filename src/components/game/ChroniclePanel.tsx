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
      className="flex-1 overflow-y-auto px-4 py-3"
      role="log"
      aria-label="编年史"
      aria-live="polite"
    >
      {turnCount === 1 && turnResults.length === 0 && (
        <div className="space-y-3">
          <div className="text-xs text-amber-500/80">{scenario.start_date}</div>
          <div className="text-sm font-serif leading-relaxed text-zinc-300">
            {scenario.player_context.background_summary}
          </div>
          <div className="text-sm font-serif leading-relaxed text-zinc-400">
            {scenario.description}
          </div>
          <div className="mt-4 rounded border border-amber-900/30 bg-amber-900/10 px-3 py-2">
            <div className="text-xs text-amber-400">当前危机</div>
            <div className="font-serif text-sm text-amber-200/80">
              阁下，作为{scenario.player_context.leader_title}
              ，您的第一道政令是什么？
            </div>
          </div>
        </div>
      )}

      {turnResults.map((result, idx) => (
        <article key={idx} className="mb-6 space-y-2">
          <div className="text-xs text-amber-500/80">{result.date_display}</div>

          <div className="text-base font-serif font-bold text-zinc-100">
            {result.headline}
          </div>

          {result.rumor && (
            <div className="font-serif text-xs italic text-zinc-400">
              民间传言：{result.rumor}
            </div>
          )}

          <div className="border-l-2 border-zinc-700 pl-3">
            <div className="font-serif text-sm leading-relaxed text-zinc-300">
              {result.narrative}
            </div>
          </div>

          {result.situation_update && (
            <div className="border-l-2 border-amber-700/50 bg-amber-900/5 px-3 py-2 rounded-r">
              <div className="text-xs uppercase tracking-wider text-amber-500/80 mb-1">
                最新情报
              </div>
              <div className="font-serif text-sm text-amber-200/80">
                {result.situation_update}
              </div>
            </div>
          )}
        </article>
      ))}

      {isLoading && (
        <div
          className="flex items-center gap-2 py-4"
          role="status"
          aria-live="polite"
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-amber-500"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-amber-500"
            style={{ animationDelay: "0.4s" }}
          />
          <span className="text-xs text-zinc-400 ml-2">推演中...</span>
        </div>
      )}
    </div>
  );
}
