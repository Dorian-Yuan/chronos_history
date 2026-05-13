import { useMemo } from "react";
import type {
  EndGameAnalysis,
  GameStats,
  GameOutcome,
  ConditionalOutcome,
  GameUniverse,
} from "@/types";
import { getTerminology } from "@/config/terminology";

interface EndGameReportProps {
  analysis: EndGameAnalysis;
  stats: GameStats;
  outcome: GameOutcome;
  conditionalOutcome?: ConditionalOutcome;
  turnCount: number;
  universe?: GameUniverse;
}

const OUTCOME_STYLE: Record<
  GameOutcome,
  { colorClass: string; emoji: string; bgClass: string }
> = {
  victory: {
    colorClass: "text-status-success-text",
    emoji: "\uD83D\uDC51",
    bgClass: "bg-status-success-bg border border-status-success-border",
  },
  neutral: {
    colorClass: "text-status-warning-text",
    emoji: "\u2696\uFE0F",
    bgClass: "bg-status-warning-bg border border-status-warning-border",
  },
  defeat: {
    colorClass: "text-status-error-text",
    emoji: "\uD83D\uDC80",
    bgClass: "bg-status-error-bg border border-status-error-border",
  },
};

export function EndGameReport({
  analysis,
  stats,
  outcome,
  conditionalOutcome,
  turnCount,
  universe = "history",
}: EndGameReportProps) {
  const term = useMemo(() => getTerminology(universe), [universe]);

  const outcomeStyle = OUTCOME_STYLE[outcome];

  const avgStat = Math.round(
    Object.values(stats).reduce((a, b) => a + b, 0) / 4,
  );

  const outcomeTitle = conditionalOutcome?.title || term.outcomeLabels[outcome];
  const outcomeDescription = conditionalOutcome?.description;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 md:p-8">
      <div className="text-center space-y-4 py-4">
        <div className="text-5xl mb-2">{outcomeStyle.emoji}</div>
        <div
          className={`text-3xl font-display font-bold ${outcomeStyle.colorClass}`}
        >
          {outcomeTitle}
        </div>
        {outcomeDescription && (
          <div className="font-serif text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            {outcomeDescription}
          </div>
        )}
        <div className="text-sm text-text-tertiary">
          {term.endGameTurnSummary
            .replace("{turn}", String(turnCount))
            .replace("{score}", String(avgStat))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card p-5">
        <div className="text-xl font-serif font-bold text-text-primary mb-3">
          {analysis.persona_title}
        </div>
        <div className="font-serif text-sm text-text-secondary leading-relaxed">
          {analysis.persona_description}
        </div>
      </div>

      <div className={`rounded-lg p-5 ${outcomeStyle.bgClass}`}>
        <div className="font-serif text-sm font-semibold text-accent-primary mb-3">
          {term.realHistoryLabel}
          {analysis.real_event_title}
        </div>
        <div className="space-y-2.5 text-sm">
          <div>
            <span className="text-text-tertiary">
              {term.historyResultLabel}
            </span>
            <span className="font-serif text-text-secondary">
              {analysis.real_outcome_summary}
            </span>
          </div>
          <div>
            <span className="text-text-tertiary">{term.yourResultLabel}</span>
            <span className="font-serif text-text-secondary">
              {analysis.user_outcome_summary}
            </span>
          </div>
        </div>
      </div>

      {analysis.modern_echo && (
        <div className="rounded-lg border border-border bg-bg-card p-5">
          <div className="section-label">{term.modernEchoLabel}</div>
          <div className="font-serif text-sm leading-relaxed text-text-secondary italic">
            {analysis.modern_echo}
          </div>
        </div>
      )}

      {analysis.alternative_history && (
        <div className="rounded-lg border border-border bg-bg-card p-5">
          <div className="section-label">{term.alternativeHistoryLabel}</div>
          <div className="font-serif text-sm leading-relaxed text-text-secondary">
            {analysis.alternative_history}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-bg-card p-5">
        <div className="section-label">{term.comparisonLabel}</div>
        <div className="font-serif text-sm leading-relaxed text-text-secondary">
          {analysis.comparison_text}
        </div>
        <div className="mt-4 text-sm">
          <span className="text-text-tertiary">{term.similarFigureLabel}</span>
          <span className="font-serif text-accent-primary font-medium">
            {analysis.similar_historical_figure}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card p-5">
        <div className="section-label">{term.rulerPortraitLabel}</div>
        <div className="space-y-4">
          {analysis.radar_stats.map((stat) => (
            <div key={stat.dimension} className="flex items-center gap-4">
              <span className="w-14 text-xs text-text-tertiary shrink-0">
                {term.dimensionLabels[stat.dimension] || stat.dimension}
              </span>
              <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full bg-accent-primary transition-all duration-700"
                  style={{ width: `${stat.value}%` }}
                />
              </div>
              <span className="font-mono text-xs text-text-secondary w-8 text-right shrink-0">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {analysis.turn_reviews.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-card p-5">
          <div className="section-label">{term.decisionReviewLabel}</div>
          <div className="space-y-5">
            {analysis.turn_reviews.map((review) => (
              <div key={review.turn} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-mono text-text-tertiary">
                  {review.turn}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-serif text-sm text-text-secondary">
                    {review.summary}
                  </div>
                  <div className="font-serif text-xs italic text-text-tertiary">
                    {review.commentary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
