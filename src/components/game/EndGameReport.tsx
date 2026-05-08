import type { EndGameAnalysis, GameStats, GameOutcome } from "@/types";

interface EndGameReportProps {
  analysis: EndGameAnalysis;
  stats: GameStats;
  outcome: GameOutcome;
  turnCount: number;
}

const OUTCOME_CONFIG: Record<
  GameOutcome,
  { label: string; color: string; emoji: string; bg: string }
> = {
  victory: {
    label: "胜利",
    color: "text-green-400",
    emoji: "👑",
    bg: "bg-green-900/10 border-green-800/20",
  },
  neutral: {
    label: "存续",
    color: "text-amber-400",
    emoji: "⚖️",
    bg: "bg-amber-900/10 border-amber-800/20",
  },
  defeat: {
    label: "失败",
    color: "text-red-400",
    emoji: "💀",
    bg: "bg-red-900/10 border-red-800/20",
  },
};

const DIMENSION_LABELS: Record<string, string> = {
  Authority: "权威",
  Strategy: "战略",
  Empathy: "共情",
  Vision: "远见",
  Economy: "经济",
};

export function EndGameReport({
  analysis,
  stats,
  outcome,
  turnCount,
}: EndGameReportProps) {
  const outcomeConfig = OUTCOME_CONFIG[outcome];

  const avgStat = Math.round(
    Object.values(stats).reduce((a, b) => a + b, 0) / 4,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="text-center space-y-3 py-4">
        <div className="text-5xl mb-2">{outcomeConfig.emoji}</div>
        <div
          className={`text-3xl font-display font-bold ${outcomeConfig.color}`}
        >
          {outcomeConfig.label}
        </div>
        <div className="text-sm text-text-tertiary">
          历经 {turnCount} 回合 · 综合评分 {avgStat}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card px-5 py-5">
        <div className="text-xl font-serif font-bold text-text-primary mb-2">
          {analysis.persona_title}
        </div>
        <div className="font-serif text-sm text-text-secondary leading-relaxed">
          {analysis.persona_description}
        </div>
      </div>

      <div className={`rounded-lg border px-5 py-5 ${outcomeConfig.bg}`}>
        <div className="text-sm font-semibold text-accent-primary mb-3">
          真实历史：{analysis.real_event_title}
        </div>
        <div className="space-y-2.5 text-sm">
          <div>
            <span className="text-text-tertiary">历史结果：</span>
            <span className="text-text-secondary">
              {analysis.real_outcome_summary}
            </span>
          </div>
          <div>
            <span className="text-text-tertiary">你的结果：</span>
            <span className="text-text-secondary">
              {analysis.user_outcome_summary}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card px-5 py-5">
        <div className="section-label">对比分析</div>
        <div className="font-serif text-sm leading-relaxed text-text-secondary">
          {analysis.comparison_text}
        </div>
        <div className="mt-4 text-sm">
          <span className="text-text-tertiary">相似历史人物：</span>
          <span className="text-accent-primary font-medium">
            {analysis.similar_historical_figure}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-card px-5 py-5">
        <div className="section-label">统治者画像</div>
        <div className="space-y-3">
          {analysis.radar_stats.map((stat) => (
            <div key={stat.dimension} className="flex items-center gap-4">
              <span className="w-14 text-xs text-text-tertiary shrink-0">
                {DIMENSION_LABELS[stat.dimension] || stat.dimension}
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
        <div className="rounded-lg border border-border bg-bg-card px-5 py-5">
          <div className="section-label">决策复盘</div>
          <div className="space-y-4">
            {analysis.turn_reviews.map((review) => (
              <div key={review.turn} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-mono text-text-tertiary">
                  {review.turn}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="text-sm text-text-secondary">
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
