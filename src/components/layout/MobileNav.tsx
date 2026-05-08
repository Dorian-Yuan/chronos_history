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
    <nav className="flex h-16 items-center justify-around border-t border-border bg-bg-secondary">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTab === tab.id ? "text-accent-primary" : "text-text-tertiary"
          }`}
        >
          <tab.icon size={20} />
          <span className="text-xs">{tab.label}</span>
        </button>
      ))}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex flex-col items-center gap-1 p-2 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <Settings size={20} />
        <span className="text-xs">{t("nav.settings")}</span>
      </button>
    </nav>
  );
}
