import { X } from "lucide-react";
import { useUIStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { AIProviderConfig } from "./AIProviderConfig";
import { getAppConfig } from "@/config";
import { getAvailableThemes, setTheme, getTheme } from "@/lib/theme";
import { useState } from "react";

export function SettingsPanel() {
  const { t } = useTranslation();
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const appConfig = getAppConfig();
  const [currentTheme, setCurrentTheme] = useState(getTheme().name);

  if (!settingsOpen) return null;

  const themes = getAvailableThemes();

  return (
    <div className="modal-overlay animate-fade-in">
      <div
        className="absolute inset-0"
        onClick={() => setSettingsOpen(false)}
      />
      <div
        className={`modal-content max-w-lg animate-slide-in-up md:animate-scale-in ${
          isMobile ? "max-h-[85vh] rounded-t-xl" : ""
        }`}
      >
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            {t("settings.title")}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-3 safe-bottom">
          <div>
            <label className="mb-1.5 block text-sm font-medium font-serif text-text-secondary">
              {t("settings.theme")}
            </label>
            <select
              value={currentTheme}
              onChange={(e) => {
                setTheme(e.target.value);
                setCurrentTheme(e.target.value);
              }}
              className="input-field"
            >
              {themes.map((th) => (
                <option key={th.name} value={th.name}>
                  {th.label}
                </option>
              ))}
            </select>
          </div>

          <div className="divider" />

          <AIProviderConfig />

          <div className="text-right text-[10px] text-text-tertiary pt-2">
            {t("app.version")}: {appConfig.version}
          </div>
        </div>
      </div>
    </div>
  );
}
