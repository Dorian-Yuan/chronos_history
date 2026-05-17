import { useEffect, useRef, useMemo } from "react";
import type { ScenarioData, TurnResult, GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";

interface ChroniclePanelProps {
  scenario: ScenarioData;
  turnCount: number;
  turnResults: TurnResult[];
  isLoading: boolean;
  universe?: GameUniverse;
}

export function ChroniclePanel({
  scenario,
  turnCount,
  turnResults,
  isLoading,
  universe = "history",
}: ChroniclePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const term = useMemo(() => getTerminology(universe), [universe]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turnResults, isLoading]);

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
          aria-label={term.chronicleLabel}
          aria-live="polite"
        >
          {turnCount === 1 && turnResults.length === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="section-label">
                {scenario.start_date || "元年"}
              </div>

              {scenario.player_context?.nation_name && (
                <div className="flex items-center gap-2">
                  <span className="text-base font-serif font-bold text-text-primary">
                    {scenario.player_context.nation_name}
                  </span>
                  {scenario.player_context?.leader_title && (
                    <span className="text-xs font-serif text-text-tertiary">
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
                  <div className="font-serif font-bold text-sm text-accent-primary tracking-widest uppercase mb-1">
                    {term.crisisLabel}
                  </div>
                  <div className="font-serif text-sm text-accent-primary leading-relaxed">
                    {scenario.description}
                  </div>
                </div>
              )}

              <div className="h-px bg-border my-4" />

              <div className="border-l-[3px] border-accent-primary pl-3">
                <div className="font-serif text-sm text-text-secondary leading-relaxed">
                  {term.chroniclePrompt
                    .replace(
                      "{honorific_prefix}",
                      scenario.player_context?.leader_label ||
                        term.defaultHonorificPrefix,
                    )
                    .replace(
                      "{title}",
                      scenario.player_context?.leader_title ||
                        term.defaultLeaderTitle,
                    )}
                </div>
              </div>
            </div>
          )}

          {turnResults.map((result, idx) => (
            <article key={idx} className="mb-6 space-y-4">
              <div className="section-label">
                第{idx + 1}回合 · {result.date_display}
              </div>

              <div className="text-lg font-serif font-bold text-text-primary leading-snug">
                {result.headline}
              </div>

              {result.rumor && (
                <div className="font-serif text-xs italic text-text-tertiary leading-relaxed">
                  {term.rumorLabel}
                  {result.rumor}
                </div>
              )}

              {result.historian_commentary && (
                <div className="border-l-[3px] border-accent-secondary bg-accent-secondary/5 px-4 py-3 rounded-r-lg">
                  <div className="font-serif font-bold text-xs text-accent-secondary tracking-widest uppercase mb-1">
                    {term.historianLabel}
                  </div>
                  <div className="font-serif text-sm text-accent-secondary leading-relaxed italic">
                    {result.historian_commentary}
                  </div>
                </div>
              )}

              <div className="border-l-[3px] border-border px-4">
                <div className="font-serif text-sm leading-relaxed text-text-secondary">
                  {result.narrative}
                </div>
              </div>

              {result.situation_update && (
                <div className="border-l-[3px] border-accent-primary bg-accent-primary/5 px-4 py-3 rounded-r-lg my-4">
                  <div className="font-serif font-bold text-sm text-accent-primary tracking-widest uppercase mb-1">
                    {term.intelLabel}
                  </div>
                  <div className="font-serif text-sm text-accent-primary leading-relaxed">
                    {result.situation_update}
                  </div>
                </div>
              )}

              {result.player_context_update &&
                (result.player_context_update.nation_name ||
                  result.player_context_update.leader_title ||
                  result.player_context_update.official_rank ||
                  result.player_context_update.superior_name) && (
                  <div className="border-l-[3px] border-accent-warning bg-accent-warning/5 px-4 py-3 rounded-r-lg my-4">
                    <div className="font-serif font-bold text-sm text-accent-warning tracking-widest uppercase mb-1">
                      {term.identityChangeLabel}
                    </div>
                    <div className="font-serif text-sm text-accent-warning leading-relaxed">
                      {result.player_context_update.change_reason}
                    </div>
                    <div className="mt-2 space-y-1">
                      {result.player_context_update.nation_name && (
                        <div className="text-xs font-serif text-text-secondary">
                          {universe === "life" ? "衙门" : "国号"}：
                          {result.player_context_update.previous_nation_name ||
                            "—"}{" "}
                          →{" "}
                          <span className="font-bold text-accent-warning">
                            {result.player_context_update.nation_name}
                          </span>
                        </div>
                      )}
                      {result.player_context_update.leader_title && (
                        <div className="text-xs font-serif text-text-secondary">
                          {universe === "life" ? "官职" : "头衔"}：
                          {result.player_context_update.previous_leader_title ||
                            "—"}{" "}
                          →{" "}
                          <span className="font-bold text-accent-warning">
                            {result.player_context_update.leader_title}
                          </span>
                        </div>
                      )}
                      {result.player_context_update.official_rank &&
                        (!result.player_context_update.previous_official_rank ||
                          result.player_context_update.previous_official_rank
                            .level !==
                            result.player_context_update.official_rank
                              .level) && (
                          <div className="text-xs font-serif text-text-secondary">
                            {term.rankLabel}
                            {result.player_context_update.previous_official_rank
                              ? result.player_context_update
                                  .previous_official_rank.level === 0
                                ? "超品"
                                : `${result.player_context_update.previous_official_rank.level}品`
                              : "—"}{" "}
                            →{" "}
                            <span className="font-bold text-accent-warning">
                              {result.player_context_update.official_rank
                                .level === 0
                                ? "超品"
                                : `${result.player_context_update.official_rank.level}品`}
                            </span>
                          </div>
                        )}
                      {result.player_context_update.superior_name && (
                        <div className="text-xs font-serif text-text-secondary">
                          {term.superiorLabel}
                          {result.player_context_update
                            .previous_superior_title &&
                          result.player_context_update.previous_superior_name
                            ? `${result.player_context_update.previous_superior_title} ${result.player_context_update.previous_superior_name}`
                            : "—"}{" "}
                          →{" "}
                          <span className="font-bold text-accent-warning">
                            {result.player_context_update.superior_title || ""}{" "}
                            {result.player_context_update.superior_name}
                          </span>
                        </div>
                      )}
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
              <span className="text-xs text-text-tertiary ml-2">
                {term.loadingText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
