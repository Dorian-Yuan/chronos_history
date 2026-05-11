import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

const ATTITUDE_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  "敌对": { stroke: "#e85a5a", fill: "#3a1a1a", text: "#e85a5a" },
  "求和": { stroke: "#4a9ef5", fill: "#1a2a3a", text: "#4a9ef5" },
  "中立": { stroke: "#666666", fill: "#2a2a2e", text: "#999999" },
  "友好": { stroke: "#2ece8b", fill: "#1a3a2a", text: "#2ece8b" },
  "臣服": { stroke: "#e8833a", fill: "#3a2a1a", text: "#e8833a" },
  "已灭亡": { stroke: "#555555", fill: "#1a1a1e", text: "#666666" },
};

function applyMapColors(container: HTMLElement) {
  const svg = container.querySelector("svg");
  if (!svg) return;

  const edgePaths = svg.querySelectorAll<SVGPathElement>(".edgePath path");
  const edgeLabels = svg.querySelectorAll<SVGGElement>(".edgeLabel");
  const nodes = svg.querySelectorAll<SVGGElement>(".node");

  const edgeAttitudes = new Map<number, string>();

  edgeLabels.forEach((labelGroup) => {
    const textEls = labelGroup.querySelectorAll("text");
    textEls.forEach((textEl) => {
      const text = textEl.textContent?.trim() || "";
      const attitude = Object.keys(ATTITUDE_COLORS).find((a) => text.includes(a));
      if (attitude) {
        const parentG = labelGroup.closest("g");
        if (parentG) {
          const allEdgeGroups = Array.from(svg.querySelectorAll("g"));
          const idx = allEdgeGroups.indexOf(parentG);
          edgeAttitudes.set(idx, attitude);
        }

        const colors = ATTITUDE_COLORS[attitude];
        if (colors) {
          textEl.style.fill = colors.text;

          const rect = labelGroup.querySelector("rect");
          if (rect) {
            rect.setAttribute("fill", colors.fill);
            rect.setAttribute("rx", "4");
            rect.setAttribute("ry", "4");
          }
        }
      }
    });
  });

  edgePaths.forEach((path, index) => {
    const pathParent = path.closest("g.edgePath");
    if (!pathParent) return;

    const allEdgeGroups = Array.from(svg.querySelectorAll("g.edgePath"));
    const pathIndex = allEdgeGroups.indexOf(pathParent as SVGGElement);

    let attitude: string | undefined;
    for (const [labelIdx, att] of edgeAttitudes) {
      if (Math.abs(labelIdx - pathIndex) < 5) {
        attitude = att;
        break;
      }
    }

    if (!attitude) {
      for (const [labelIdx, att] of edgeAttitudes) {
        attitude = att;
        break;
      }
    }

    if (attitude && ATTITUDE_COLORS[attitude]) {
      const colors = ATTITUDE_COLORS[attitude];
      path.style.stroke = colors.stroke;
      path.style.strokeWidth = attitude === "友好" || attitude === "臣服" ? "3px" : "2px";
    }
  });

  const edgeLabelList = Array.from(edgeLabels);
  const edgePathList = Array.from(edgePaths);

  if (edgeLabelList.length > 0 && edgePathList.length > 0) {
    const labelAttitudes: string[] = [];
    edgeLabelList.forEach((labelGroup) => {
      const textEls = labelGroup.querySelectorAll("text");
      let foundAttitude = "";
      textEls.forEach((textEl) => {
        const text = textEl.textContent?.trim() || "";
        const attitude = Object.keys(ATTITUDE_COLORS).find((a) => text.includes(a));
        if (attitude) foundAttitude = attitude;
      });
      labelAttitudes.push(foundAttitude);
    });

    edgePathList.forEach((path, index) => {
      if (index < labelAttitudes.length) {
        const attitude = labelAttitudes[index];
        if (attitude && ATTITUDE_COLORS[attitude]) {
          const colors = ATTITUDE_COLORS[attitude];
          path.style.stroke = colors.stroke;
          path.style.strokeWidth = attitude === "友好" || attitude === "臣服" ? "3px" : "2px";
        }
      }
    });
  }

  nodes.forEach((nodeGroup) => {
    const textEls = nodeGroup.querySelectorAll("text");
    let nodeAttitude = "";

    textEls.forEach((textEl) => {
      const text = textEl.textContent?.trim() || "";
      for (const attitude of Object.keys(ATTITUDE_COLORS)) {
        if (text.includes(`(${attitude})`)) {
          nodeAttitude = attitude;
          break;
        }
      }
      if (text.includes("已灭亡:")) {
        nodeAttitude = "已灭亡";
      }
    });

    if (nodeAttitude && ATTITUDE_COLORS[nodeAttitude]) {
      const colors = ATTITUDE_COLORS[nodeAttitude];

      const rect = nodeGroup.querySelector("rect");
      if (rect) {
        rect.setAttribute("fill", colors.fill);
        rect.setAttribute("stroke", colors.stroke);
        rect.setAttribute("stroke-width", "2");
        if (nodeAttitude === "已灭亡") {
          rect.setAttribute("stroke-dasharray", "4,4");
        }
      }

      const polygon = nodeGroup.querySelector("polygon");
      if (polygon) {
        polygon.setAttribute("fill", colors.fill);
        polygon.setAttribute("stroke", colors.stroke);
        polygon.setAttribute("stroke-width", "2");
      }
    }
  });
}

let mermaidInitialized = false;
let mermaidModule: typeof import("mermaid").default | null = null;

async function loadMermaid() {
  if (mermaidModule) return mermaidModule;
  const mod = await import("mermaid");
  mermaidModule = mod.default;
  if (!mermaidInitialized) {
    mermaidModule.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#1a3a2a",
        primaryTextColor: "#e0e0e0",
        primaryBorderColor: "#2ece8b",
        lineColor: "#52525b",
        secondaryColor: "#1a1a1e",
        tertiaryColor: "#2a2a2e",
        background: "#0a0a0a",
        mainBkg: "#1a1a1e",
        nodeBorder: "#2ece8b",
        clusterBkg: "#141418",
        clusterBorder: "#2a2a2e",
        titleColor: "#e0e0e0",
        edgeLabelBackground: "#1a1a1e",
        nodeTextColor: "#e0e0e0",
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        padding: 15,
      },
      securityLevel: "loose",
    });
    mermaidInitialized = true;
  }
  return mermaidModule;
}

let renderCounter = 0;

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const renderChart = useCallback(async () => {
    if (!chart?.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mermaid = await loadMermaid();
      const id = `mermaid-${++renderCounter}-${Date.now()}`;

      const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
      setSvg(renderedSvg);
      setError("");
    } catch (err) {
      console.error("[MermaidDiagram] Render error:", err);
      const errorMessage = err instanceof Error ? err.message : "图表渲染失败";
      setError(errorMessage);
      const el = document.getElementById(`mermaid-${renderCounter}`);
      if (el) el.remove();
    } finally {
      setLoading(false);
    }
  }, [chart]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  useEffect(() => {
    if (svg && containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          applyMapColors(containerRef.current);
        }
      });
    }
  }, [svg]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className || ""}`}>
        <div className="flex flex-col items-center gap-2 text-text-tertiary">
          <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          <span className="text-xs font-serif">加载舆图引擎...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-status-error-border bg-status-error-bg/50 p-4 ${className || ""}`}>
        <p className="text-xs text-status-error-text mb-2">舆图渲染失败</p>
        <details className="text-xs text-text-tertiary">
          <summary className="cursor-pointer hover:text-text-secondary">查看原始代码</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all text-[10px] bg-bg-tertiary p-2 rounded overflow-auto max-h-40">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className || ""}`}
      style={{ overflow: "auto", maxWidth: "100%" }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{
          display: "flex",
          justifyContent: "center",
          minHeight: "200px",
        }}
      />
    </div>
  );
}
