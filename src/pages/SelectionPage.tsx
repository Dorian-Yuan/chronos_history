import { useState } from "react";
import { useGameDispatch } from "@/lib/game";
import { generateScenario } from "@/lib/game";
import type { PlayStyle } from "@/types";
import { PLAY_STYLES } from "@/types";
import { Swords, Coins, BookOpen, Shield, ScrollText } from "lucide-react";
import { ScenarioHintModal } from "@/components/game";

const STYLE_ICONS: Record<PlayStyle, typeof Swords> = {
  Conquest: Swords,
  Prosperity: Coins,
  Reform: BookOpen,
  Survival: Shield,
  Officialdom: ScrollText,
};

const STYLE_COLORS: Record<
  PlayStyle,
  { border: string; bg: string; text: string; glow: string }
> = {
  Conquest: {
    border: "border-accent-danger/40",
    bg: "bg-status-error-bg",
    text: "text-accent-danger",
    glow: "group-hover:shadow-accent-danger/20",
  },
  Prosperity: {
    border: "border-accent-secondary/40",
    bg: "bg-status-warning-bg",
    text: "text-accent-secondary",
    glow: "group-hover:shadow-accent-secondary/20",
  },
  Reform: {
    border: "border-accent-info/40",
    bg: "bg-status-info-bg",
    text: "text-accent-info",
    glow: "group-hover:shadow-accent-info/20",
  },
  Survival: {
    border: "border-accent-primary/40",
    bg: "bg-status-success-bg",
    text: "text-accent-primary",
    glow: "group-hover:shadow-accent-primary/20",
  },
  Officialdom: {
    border: "border-accent-warning/40",
    bg: "bg-status-warning-bg",
    text: "text-accent-warning",
    glow: "group-hover:shadow-accent-warning/20",
  },
};

export function SelectionPage() {
  const dispatch = useGameDispatch();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<PlayStyle | null>(null);
  const [progressText, setProgressText] = useState("正在生成剧本...");

  const handleSelect = async (playStyle: PlayStyle, userHint?: string) => {
    setGenerating(true);
    setError(null);
    setSelectedStyle(null);

    try {
      const scenario = await generateScenario(playStyle, userHint, (stage) => {
        setProgressText(stage);
      });
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
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="font-serif text-2xl font-bold text-text-primary">
          选择执政基调
        </h1>
      </div>

      {generating ? (
        <div
          className="flex flex-col items-center gap-5 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="flex gap-2.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-primary" />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-accent-primary"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <p className="text-sm font-serif text-text-secondary">
            {progressText}
          </p>
        </div>
      ) : (
        <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
          {PLAY_STYLES.map((style, idx) => {
            const Icon = STYLE_ICONS[style.id];
            const colors = STYLE_COLORS[style.id];
            return (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`group card-interactive text-left ${colors.border} ${colors.bg} shadow-md ${colors.glow}`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.bg} border ${colors.border}`}
                  >
                    <Icon size={13} className={colors.text} />
                  </div>
                  <h2 className="text-sm font-serif font-bold text-text-primary">
                    {style.name}
                  </h2>
                  <span className="font-serif text-xs italic text-text-tertiary/70 truncate">
                    &ldquo;{style.quote}&rdquo;
                  </span>
                </div>

                <p className="text-xs font-serif text-text-tertiary leading-relaxed">
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
          className="mt-6 rounded-lg border border-status-error-border bg-status-error-bg px-4 py-2.5 text-xs text-status-error-text"
        >
          {error}
        </div>
      )}

      {selectedStyle && (
        <ScenarioHintModal
          playStyle={selectedStyle}
          onConfirm={(hint) => handleSelect(selectedStyle, hint)}
          onCancel={() => setSelectedStyle(null)}
        />
      )}
    </main>
  );
}
