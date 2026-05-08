import { useState } from "react";
import { useGameDispatch } from "@/lib/game";
import { generateScenario } from "@/lib/game";
import type { PlayStyle } from "@/types";
import { PLAY_STYLES } from "@/types";

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
      setError(e instanceof Error ? e.message : "生成剧本失败，请重试");
      setGenerating(false);
    }
  };

  return (
    <main className="flex h-full flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-serif font-bold text-zinc-100">
          选择执政基调
        </h1>
        <p className="text-sm text-zinc-400">
          不同的基调将带来截然不同的历史剧本
        </p>
      </div>

      {generating ? (
        <div
          className="flex flex-col items-center gap-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
            <div
              className="h-3 w-3 animate-pulse rounded-full bg-amber-500"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="h-3 w-3 animate-pulse rounded-full bg-amber-500"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <p className="text-sm text-zinc-400">正在生成剧本...</p>
        </div>
      ) : (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {PLAY_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => handleSelect(style.id)}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-left transition-all hover:border-amber-700/50 hover:bg-zinc-800/50"
            >
              <h2 className="mb-1 text-lg font-serif font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">
                {style.name}
              </h2>
              <p className="mb-3 font-serif text-sm italic text-zinc-400">
                &ldquo;{style.quote}&rdquo;
              </p>
              <p className="text-xs text-zinc-400">{style.description}</p>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2 text-sm text-red-400"
        >
          {error}
        </div>
      )}
    </main>
  );
}
