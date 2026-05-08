import { useState } from "react";
import { useGameDispatch } from "@/lib/game";
import { generateScenario } from "@/lib/game";
import type { PlayStyle } from "@/types";
import { PLAY_STYLES } from "@/types";
import { Swords, Coins, BookOpen, Shield } from "lucide-react";

const STYLE_ICONS: Record<PlayStyle, typeof Swords> = {
  Conquest: Swords,
  Prosperity: Coins,
  Reform: BookOpen,
  Survival: Shield,
};

const STYLE_COLORS: Record<
  PlayStyle,
  { border: string; bg: string; text: string; glow: string }
> = {
  Conquest: {
    border: "border-red-800/40",
    bg: "bg-red-900/10",
    text: "text-red-400",
    glow: "group-hover:shadow-red-900/20",
  },
  Prosperity: {
    border: "border-amber-800/40",
    bg: "bg-amber-900/10",
    text: "text-amber-400",
    glow: "group-hover:shadow-amber-900/20",
  },
  Reform: {
    border: "border-blue-800/40",
    bg: "bg-blue-900/10",
    text: "text-blue-400",
    glow: "group-hover:shadow-blue-900/20",
  },
  Survival: {
    border: "border-emerald-800/40",
    bg: "bg-emerald-900/10",
    text: "text-emerald-400",
    glow: "group-hover:shadow-emerald-900/20",
  },
};

export function SelectionPage() {
  const dispatch = useGameDispatch();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (playStyle: PlayStyle) => {
    setGenerating(true);
    setError(null);

    try {
      const scenario = await generateScenario(playStyle);
      dispatch({ type: "SET_SCENARIO", scenario });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "生成剧本失败，请重试";
      if (
        msg.includes("JSON") ||
        msg.includes("json") ||
        msg.includes("Unrecognized token")
      ) {
        setError("AI 返回格式异常，请检查 API 配置或更换模型后重试");
      } else {
        setError(msg);
      }
      setGenerating(false);
    }
  };

  return (
    <main className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-10 text-center space-y-4 animate-fade-in">
        <h1 className="font-serif text-2xl font-bold text-text-primary">
          选择执政基调
        </h1>
        <p className="text-sm text-text-tertiary max-w-sm mx-auto leading-relaxed">
          不同的基调将带来截然不同的历史剧本与挑战
        </p>
      </div>

      {generating ? (
        <div
          className="flex flex-col items-center gap-5 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex gap-2.5">
            <div className="h-3 w-3 animate-pulse rounded-full bg-accent-primary" />
            <div
              className="h-3 w-3 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="h-3 w-3 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <p className="text-sm text-text-secondary">正在生成剧本...</p>
        </div>
      ) : (
        <div className="grid w-full max-w-lg grid-cols-1 gap-5 sm:grid-cols-2">
          {PLAY_STYLES.map((style, idx) => {
            const Icon = STYLE_ICONS[style.id];
            const colors = STYLE_COLORS[style.id];
            return (
              <button
                key={style.id}
                onClick={() => handleSelect(style.id)}
                className={`group card-interactive px-5 py-5 text-left ${colors.border} ${colors.bg} shadow-md ${colors.glow}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg} border ${colors.border}`}
                  >
                    <Icon size={16} className={colors.text} />
                  </div>
                  <h2 className="text-base font-serif font-bold text-text-primary">
                    {style.name}
                  </h2>
                </div>

                <p className="font-serif text-xs italic leading-relaxed text-text-secondary mb-4">
                  &ldquo;{style.quote}&rdquo;
                </p>

                <p className="text-xs text-text-tertiary leading-relaxed">
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-900/30 bg-red-900/10 px-5 py-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}
    </main>
  );
}
