import { useEffect, useRef, useCallback } from "react";
import type { SandTableState, GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";
import { useSettingsStore } from "@/stores";
import {
  createSandTableEngine,
  updateFactionPowers,
  renderSandTableToImageData,
  drawFactionLabels,
  drawDirectionLabels,
  checkConquest,
} from "@/lib/sand-table/engine";

interface SandTablePanelProps {
  sandTableState: SandTableState | null;
  isLoading: boolean;
  universe?: GameUniverse;
  error?: string | null;
  onRetry?: () => void;
}

function isDarkMode(): boolean {
  const theme = useSettingsStore.getState().theme;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return !window.matchMedia("(prefers-color-scheme: light)").matches;
}

export function SandTablePanel({
  sandTableState,
  isLoading,
  universe = "history",
  error,
  onRetry,
}: SandTablePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const engineRef = useRef<ReturnType<typeof createSandTableEngine> | null>(
    null,
  );
  const needsInitialRenderRef = useRef(true);
  const isDarkRef = useRef(isDarkMode());
  const term = getTerminology(universe);
  const theme = useSettingsStore((s) => s.theme);

  isDarkRef.current = isDarkMode();

  const initEngine = useCallback(() => {
    if (!sandTableState) return;
    const engine = createSandTableEngine(sandTableState);
    engineRef.current = engine;
    needsInitialRenderRef.current = true;

    const offscreen = document.createElement("canvas");
    offscreen.width = engine.simW;
    offscreen.height = engine.simH;
    offscreenRef.current = offscreen;
  }, [sandTableState]);

  const render = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;

    if (!engine || !canvas || !offscreen) {
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    const offCtx = offscreen.getContext("2d", { alpha: false });
    if (!ctx || !offCtx) {
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }

    const dark = isDarkRef.current;

    const needsRedraw =
      updateFactionPowers(engine.factions) || needsInitialRenderRef.current;

    if (needsRedraw) {
      needsInitialRenderRef.current = false;
      const conquest = checkConquest(engine.factions);
      if (conquest) {
        const conqueror = engine.factions.find(
          (f) => f.name === conquest.conqueror,
        );
        const conquered = engine.factions.find(
          (f) => f.name === conquest.conquered,
        );
        if (conqueror && conquered) {
          conqueror.nodes.push(...conquered.nodes);
          conqueror.targetPower += conquered.power;
          conquered.dead = true;
          conquered.targetPower = 0.1;
          conquered.power = 0.1;
        }
      }

      const imgData = offCtx.createImageData(engine.simW, engine.simH);
      renderSandTableToImageData(
        imgData,
        engine.simW,
        engine.simH,
        engine.factions,
        engine.terrainMap,
        dark,
        engine.seed,
      );
      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, engine.renderW, engine.renderH);

      drawFactionLabels(ctx, engine.factions, engine.scale, dark);
      drawDirectionLabels(ctx, engine.renderW, engine.renderH, dark);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  useEffect(() => {
    if (!sandTableState) return;

    needsInitialRenderRef.current = true;
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sandTableState, render, theme]);

  const canvasBg = isDarkRef.current ? "#111" : "#f0ece4";

  if (!sandTableState) {
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
          <div className="flex-1 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                <p className="text-xs font-serif text-text-tertiary">
                  {((term as Record<string, unknown>)
                    .sandTableEmptyHint as string) || "正在推演天下大势..."}
                </p>
              </div>
            ) : error === "failed" ? (
              <div className="flex flex-col items-center gap-3 text-text-tertiary">
                <p className="text-xs font-serif">沙盘生成失败</p>
                <p className="text-xs text-text-tertiary/60 font-serif">
                  AI 推演未能完成，请重试
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-3 py-1 text-xs font-serif rounded border border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10 transition-colors"
                  >
                    重新推演
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-tertiary">
                <p className="text-xs font-serif">
                  {((term as Record<string, unknown>)
                    .sandTableEmptyLabel as string) || "沙盘尚未生成"}
                </p>
                <p className="text-xs text-text-tertiary/60 font-serif">
                  {((term as Record<string, unknown>)
                    .sandTableEmptyHint as string) || "正在推演天下大势..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-xs font-serif text-text-secondary">
            {((term as Record<string, unknown>).sandTableTurnLabel as string) ||
              "沙盘"}{" "}
            ·{" "}
            {((term as Record<string, unknown>).turnLabel as string) || "回合"}{" "}
            {sandTableState.lastUpdateTurn}
          </span>
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-primary" />
              <span className="text-xs text-text-tertiary">
                {((term as Record<string, unknown>)
                  .sandTableUpdatingLabel as string) || "更新中..."}
              </span>
            </div>
          ) : error === "fallback" ? (
            <span className="text-[10px] text-text-tertiary/60 font-serif">
              简化版
            </span>
          ) : null}
        </div>
        <div className="flex-1 flex items-center justify-center p-4 min-h-0">
          <canvas
            ref={canvasRef}
            width={360}
            height={480}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              imageRendering: "pixelated",
              border: "2px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: isDarkRef.current
                ? "0 4px 12px rgba(0,0,0,0.25)"
                : "0 4px 12px rgba(0,0,0,0.06)",
              background: canvasBg,
            }}
          />
        </div>
        <div className="px-4 py-2 border-t border-border">
          <div className="flex flex-wrap gap-3">
            {sandTableState.factions
              .filter((f) => !f.dead)
              .map((f) => (
                <div key={f.id} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-border"
                    style={{
                      backgroundColor: `rgb(${f.rgb.join(",")})`,
                    }}
                  />
                  <span className="text-xs font-serif text-text-secondary">
                    {f.name}
                  </span>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {f.targetPower.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
