import type { EndGameAnalysis, GameStats, GameOutcome } from "@/types";

interface EndGameReportProps {
  analysis: EndGameAnalysis;
  stats: GameStats;
  outcome: GameOutcome;
  turnCount: number;
}

const OUTCOME_CONFIG: Record<
  GameOutcome,
  { label: string; color: string; emoji: string }
> = {
  victory: { label: "胜利", color: "text-green-400", emoji: "👑" },
  neutral: { label: "存续", color: "text-amber-400", emoji: "⚖️" },
  defeat: { label: "失败", color: "text-red-400", emoji: "💀" },
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
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="text-center">
        <div className="text-4xl mb-2">{outcomeConfig.emoji}</div>
        <div className={`text-2xl font-serif font-bold ${outcomeConfig.color}`}>
          {outcomeConfig.label}
        </div>
        <div className="text-sm text-zinc-500 mt-1">
          历经 {turnCount} 回合 · 综合评分 {avgStat}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-lg font-serif font-bold text-zinc-200 mb-1">
          {analysis.persona_title}
        </div>
        <div className="font-serif text-sm text-zinc-400">
          {analysis.persona_description}
        </div>
      </div>

      <div className="rounded-lg border border-amber-900/30 bg-amber-900/10 p-4">
        <div className="text-sm font-medium text-amber-400 mb-2">
          真实历史：{analysis.real_event_title}
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-zinc-500">历史结果：</span>
            <span className="text-zinc-300">
              {analysis.real_outcome_summary}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">你的结果：</span>
            <span className="text-zinc-300">
              {analysis.user_outcome_summary}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-sm font-medium text-zinc-400 mb-3">对比分析</div>
        <div className="font-serif text-sm leading-relaxed text-zinc-300">
          {analysis.comparison_text}
        </div>
        <div className="mt-3 text-sm">
          <span className="text-zinc-500">相似历史人物：</span>
          <span className="text-amber-400">
            {analysis.similar_historical_figure}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="text-sm font-medium text-zinc-400 mb-3">统治者画像</div>
        <div className="space-y-2">
          {analysis.radar_stats.map((stat) => (
            <div key={stat.dimension} className="flex items-center gap-3">
              <span className="w-12 text-xs text-zinc-500">
                {DIMENSION_LABELS[stat.dimension] || stat.dimension}
              </span>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${stat.value}%` }}
                />
              </div>
              <span className="font-mono text-xs text-zinc-400 w-8 text-right">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {analysis.turn_reviews.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-sm font-medium text-zinc-400 mb-3">决策复盘</div>
          <div className="space-y-3">
            {analysis.turn_reviews.map((review) => (
              <div key={review.turn} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-mono text-zinc-500">
                  {review.turn}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs text-zinc-300">{review.summary}</div>
                  <div className="font-serif text-xs italic text-zinc-500">
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
