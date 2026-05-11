import { useState, useCallback } from "react";
import { useGameState, useGameDispatch, generateMap } from "@/lib/game";
import { MermaidDiagram } from "./MermaidDiagram";
import { RefreshCw, Map as MapIcon } from "lucide-react";
import type { MapData, ScenarioData, GameStats } from "@/types";

interface MapPanelProps {
  scenario: ScenarioData | null;
  stats: GameStats;
  turnCount: number;
  historyLog: string[];
}

const ATTITUDE_LEGEND = [
  { label: "敌对", color: "var(--color-accent-danger)" },
  { label: "求和", color: "var(--color-accent-info)" },
  { label: "中立", color: "var(--color-text-tertiary)" },
  { label: "友好", color: "var(--color-accent-success)" },
  { label: "臣服", color: "var(--color-accent-warning)" },
  { label: "已灭亡", color: "var(--color-text-tertiary)" },
];

export function MapPanel({ scenario, stats, turnCount, historyLog }: MapPanelProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapData: MapData | null = state.mapData;

  const handleGenerate = useCallback(async () => {
    if (!scenario || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateMap(scenario, historyLog, stats, turnCount);
      dispatch({ type: "SET_MAP_DATA", mapData: result });
    } catch (e) {
      console.error("[MapPanel] Failed to generate map:", e);
      const msg = e instanceof Error ? e.message : "舆图生成失败";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [scenario, historyLog, stats, turnCount, dispatch, isGenerating]);

  if (!scenario) {
    return (
      <section className="flex flex-col items-center justify-center py-12 px-5" aria-label="舆图面板">
        <MapIcon size={32} className="text-text-tertiary/40 mb-3" />
        <p className="text-xs font-serif text-text-tertiary">尚无剧本数据</p>
      </section>
    );
  }

  const isEmpty = !mapData && !isGenerating;

  return (
    <section className="flex flex-col h-full" aria-label="舆图面板">
      <div className="flex-1 overflow-auto px-4 py-3">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <MapIcon size={36} className="mb-3 opacity-40" />
            <p className="text-xs font-serif mb-1">战略舆图尚未绘制</p>
            <p className="text-xs text-text-tertiary/60 font-serif mb-4">
              点击下方按钮生成当前战略态势图
            </p>
            <button
              onClick={handleGenerate}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <MapIcon size={14} />
              绘制舆图
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mb-3" />
            <p className="text-xs font-serif">正在绘制战略舆图...</p>
          </div>
        )}

        {mapData && !isGenerating && (
          <div className="flex flex-col gap-3">
            <MermaidDiagram chart={mapData.mermaid_code} />

            {mapData.map_narrative && (
              <div className="rounded-lg border border-border bg-bg-secondary p-3">
                <p className="text-xs font-serif text-text-secondary leading-relaxed italic">
                  {mapData.map_narrative}
                </p>
              </div>
            )}

            {mapData.updated_at > 0 && (
              <p className="text-[10px] text-text-tertiary/60 text-center font-mono">
                第{mapData.updated_at}回合绘制
              </p>
            )}
          </div>
        )}

        {error && !isGenerating && (
          <div className="rounded-lg border border-status-error-border bg-status-error-bg/50 p-3 mt-2">
            <p className="text-xs text-status-error-text">{error}</p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {ATTITUDE_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-text-tertiary">{item.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-ghost text-xs flex items-center gap-1 shrink-0 py-1.5 px-2"
            aria-label="重新生成舆图"
          >
            <RefreshCw
              size={12}
              className={isGenerating ? "animate-spin" : ""}
            />
            <span>{mapData ? "重绘" : "绘制"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
