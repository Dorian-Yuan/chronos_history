import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
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
