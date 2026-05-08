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
    <header className="flex h-14 items-center justify-between border-b border-border bg-bg-secondary/80 px-4 safe-top backdrop-blur-md">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="touch-target flex items-center justify-center rounded-xl p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary">
            <span className="font-serif text-xs font-bold">史</span>
          </div>
          <h1 className="font-serif text-lg font-semibold tracking-wide text-text-primary">
            {currentSession?.title || t("app.title")}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {worldState && <YearOdometer year={worldState.year} />}
        <button
          onClick={() => setSettingsOpen(true)}
          className="touch-target flex items-center justify-center rounded-xl p-2 text-text-secondary hover:bg-bg-hover hover:text-accent-primary active:scale-95 transition-all"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
