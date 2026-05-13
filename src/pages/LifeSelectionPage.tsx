import { useState } from "react";
import { useGameDispatch } from "@/lib/game";
import { generateScenario } from "@/lib/game";
import type { LifeMode } from "@/types";
import { LIFE_MODES } from "@/types";
import { Compass } from "lucide-react";
import { ScenarioHintModal } from "@/components/game";

const MODE_ICONS: Record<LifeMode, typeof Compass> = {
  Officialdom: Compass,
};

const MODE_COLORS: Record<
  LifeMode,
  { border: string; bg: string; text: string; glow: string }
> = {
  Officialdom: {
    border: "border-accent-secondary/40",
    bg: "bg-status-warning-bg",
    text: "text-accent-secondary",
    glow: "group-hover:shadow-accent-secondary/20",
  },
};

export function LifeSelectionPage() {
  const dispatch = useGameDispatch();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<LifeMode | null>(null);
  const [progressText, setProgressText] = useState("正在生成剧本...");

  const handleSelect = async (lifeMode: LifeMode, userHint?: string) => {
    setGenerating(true);
    setError(null);
    setSelectedMode(null);

    try {
      const scenario = await generateScenario(
        lifeMode,
        userHint,
        (stage) => {
          setProgressText(stage);
        },
        "life",
      );
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
          选择人生轨迹
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
          {LIFE_MODES.map((mode, idx) => {
            const Icon = MODE_ICONS[mode.id];
            const colors = MODE_COLORS[mode.id];
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
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
                    {mode.name}
                  </h2>
                  <span className="font-serif text-xs italic text-text-tertiary/70 truncate">
                    &ldquo;{mode.quote}&rdquo;
                  </span>
                </div>

                <p className="text-xs font-serif text-text-tertiary leading-relaxed">
                  {mode.description}
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

      {selectedMode && (
        <ScenarioHintModal
          playStyle={selectedMode}
          onConfirm={(hint) => handleSelect(selectedMode, hint)}
          onCancel={() => setSelectedMode(null)}
        />
      )}
    </main>
  );
}
