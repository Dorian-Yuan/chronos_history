import { Clock, Trash2, Plus, Download, Upload } from "lucide-react";
import {
  useSessionStore,
  useUIStore,
  useWorldStateStore,
  useChatStore,
} from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import {
  loadFullSession,
  exportSession,
  importSession,
  getAllSessions,
} from "@/lib/db";
import { useNavigate } from "react-router-dom";

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sessions = useSessionStore((s) => s.sessions);
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const setCurrentSessionId = useSessionStore((s) => s.setCurrentSessionId);
  const removeSession = useSessionStore((s) => s.removeSession);
  const setSessions = useSessionStore((s) => s.setSessions);
  const isMobile = useUIStore((s) => s.isMobile);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const handleSelectSession = async (id: string) => {
    setCurrentSessionId(id);
    try {
      const session = await loadFullSession(id);
      if (session) {
        if (session.worldState) {
          useWorldStateStore.getState().setWorldState(session.worldState);
        }
        useChatStore.getState().setMessages(session.messages);
      }
    } catch (e) {
      console.warn("Failed to load session:", e);
    }
    navigate("/game");
    if (isMobile) setSidebarOpen(false);
  };

  const handleExport = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const json = await exportSession(sessionId);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronos-session-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importSession(text);
        const updated = await getAllSessions();
        setSessions(updated);
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    input.click();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-bg-secondary">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-sm font-medium text-text-secondary">
          {t("session.title")}
        </h2>
        <button className="p-1 text-text-tertiary hover:text-accent-primary transition-colors">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-text-tertiary">
            {t("session.newSession")}
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`w-full flex items-start gap-3 p-3 text-left hover:bg-bg-hover transition-colors ${
                session.id === currentSessionId
                  ? "bg-bg-active border-l-2 border-accent-primary"
                  : ""
              }`}
            >
              <Clock size={14} className="mt-0.5 shrink-0 text-text-tertiary" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm text-text-primary">
                  {session.title}
                </div>
                <div className="text-xs text-text-tertiary">
                  {session.year} ·{" "}
                  {new Date(session.lastUpdated).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleExport(e, session.id)}
                  className="p-0.5 text-text-tertiary hover:text-accent-primary transition-colors"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(session.id);
                  }}
                  className="p-0.5 text-text-tertiary hover:text-accent-danger transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-border p-3">
        <button
          onClick={handleImport}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <Upload size={14} />
          {t("session.importSession")}
        </button>
      </div>
    </aside>
  );
}
