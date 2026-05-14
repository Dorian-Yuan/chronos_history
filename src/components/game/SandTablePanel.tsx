import { useEffect, useRef, useCallback } from "react";
import type { SandTableState, GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";
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
}

export function SandTablePanel({
  sandTableState,
  isLoading,
  universe = "history",
}: SandTablePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const engineRef = useRef<ReturnType<typeof createSandTableEngine> | null>(
    null,
  );
  const needsInitialRenderRef = useRef(true);
  const term = getTerminology(universe);

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
    if (!engine || !canvas || !offscreen) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const offCtx = offscreen.getContext("2d", { alpha: false });
    if (!ctx || !offCtx) return;

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
      );
      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, engine.renderW, engine.renderH);

      drawFactionLabels(ctx, engine.factions, engine.scale);
      drawDirectionLabels(ctx, engine.renderW, engine.renderH);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  useEffect(() => {
    if (!sandTableState) return;

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sandTableState, render]);

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
            <div className="flex flex-col items-center gap-2 text-text-tertiary">
              <p className="text-xs font-serif">
                {((term as Record<string, unknown>)
                  .sandTableEmptyLabel as string) || "沙盘尚未生成"}
              </p>
              <p className="text-xs text-text-tertiary/60 font-serif">
                {((term as Record<string, unknown>)
                  .sandTableEmptyHint as string) || "完成第一回合后将生成沙盘"}
              </p>
            </div>
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
          {isLoading && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-primary" />
              <span className="text-xs text-text-tertiary">
                {((term as Record<string, unknown>)
                  .sandTableUpdatingLabel as string) || "更新中..."}
              </span>
            </div>
          )}
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
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
              background: "#111",
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
                  {f.isPlayer && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-accent-primary/10 text-accent-primary font-serif">
                      {((term as Record<string, unknown>)
                        .sandTablePlayerLabel as string) || "我"}
                    </span>
                  )}
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
