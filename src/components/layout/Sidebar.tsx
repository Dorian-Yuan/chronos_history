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
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-serif text-sm font-medium text-accent-primary decorative-line">
          {t("session.title")}
        </h2>
        <button className="touch-target flex items-center justify-center rounded-xl p-2 text-text-tertiary hover:bg-bg-hover hover:text-accent-primary active:scale-95 transition-all">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-tertiary">
              <Clock size={22} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-tertiary">
              {t("session.newSession")}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-accent-primary/10 border border-accent-primary/20"
                      : "border border-transparent hover:bg-bg-hover"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-accent-primary/20 text-accent-primary"
                        : "bg-bg-tertiary text-text-tertiary"
                    }`}
                  >
                    <Clock size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`truncate text-sm ${
                        isActive
                          ? "font-medium text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      {session.title}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {session.year} ·{" "}
                      {new Date(session.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExport(e, session.id)}
                      className="touch-target flex items-center justify-center rounded-lg p-1 text-text-tertiary hover:text-accent-primary active:scale-95 transition-all"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSession(session.id);
                      }}
                      className="touch-target flex items-center justify-center rounded-lg p-1 text-text-tertiary hover:text-accent-danger active:scale-95 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <button
          onClick={handleImport}
          className="touch-target flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary active:scale-[0.98] transition-all"
        >
          <Upload size={14} />
          {t("session.importSession")}
        </button>
      </div>
    </aside>
  );
}
