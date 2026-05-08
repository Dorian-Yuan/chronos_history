import { Settings, Menu } from "lucide-react";
import { YearOdometer } from "./YearOdometer";
import { useUIStore, useWorldStateStore, useSessionStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";

export function Header() {
  const { t } = useTranslation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const worldState = useWorldStateStore((s) => s.worldState);
  const currentSession = useSessionStore((s) => s.getCurrentSession());

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold tracking-tight">
          {currentSession?.title || t("app.title")}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {worldState && <YearOdometer year={worldState.year} />}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
