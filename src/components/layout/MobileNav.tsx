import { Gamepad2, BarChart3, Clock, Settings } from "lucide-react";
import { useUIStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";

export function MobileNav() {
  const { t } = useTranslation();
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const tabs = [
    { id: "game" as const, icon: Gamepad2, label: t("nav.game") },
    { id: "state" as const, icon: BarChart3, label: t("game.worldState") },
    { id: "timeline" as const, icon: Clock, label: t("game.timeline") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-header glass safe-bottom flex h-16 items-center justify-around border-t border-border/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`touch-target relative flex flex-col items-center gap-0.5 rounded-xl px-5 py-1.5 transition-all active:scale-95 ${
              isActive
                ? "text-accent-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <tab.icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && (
              <div className="absolute -bottom-1.5 h-0.5 w-6 rounded-full bg-accent-primary transition-all" />
            )}
          </button>
        );
      })}
      <button
        onClick={() => setSettingsOpen(true)}
        className="touch-target flex flex-col items-center gap-0.5 rounded-xl px-5 py-1.5 text-text-tertiary hover:text-text-secondary active:scale-95 transition-all"
      >
        <Settings size={20} strokeWidth={1.5} />
        <span className="text-[10px] font-medium">{t("nav.settings")}</span>
      </button>
    </nav>
  );
}
