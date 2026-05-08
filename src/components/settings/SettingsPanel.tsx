import { X } from "lucide-react";
import { useUIStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { AIProviderConfig } from "./AIProviderConfig";
import { getAppConfig } from "@/config";
import { setLocale } from "@/i18n";
import { getAvailableThemes, setTheme, getTheme } from "@/lib/theme";
import { useState } from "react";

export function SettingsPanel() {
  const {
    t,
    locale,
    setLocale: setLocaleHook,
    availableLocales,
  } = useTranslation();
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const appConfig = getAppConfig();
  const [currentTheme, setCurrentTheme] = useState(getTheme().name);

  if (!settingsOpen) return null;

  const themes = getAvailableThemes();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl border border-border bg-bg-secondary p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("settings.title")}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              {t("settings.language")}
            </label>
            <select
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value);
                setLocaleHook(e.target.value);
              }}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
            >
              {availableLocales.map((l) => (
                <option key={l} value={l}>
                  {l === "zh" ? "中文" : "English"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              {t("settings.theme")}
            </label>
            <select
              value={currentTheme}
              onChange={(e) => {
                setTheme(e.target.value);
                setCurrentTheme(e.target.value);
              }}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
            >
              {themes.map((th) => (
                <option key={th.name} value={th.name}>
                  {locale === "zh" ? th.label : th.labelEn}
                </option>
              ))}
            </select>
          </div>

          <AIProviderConfig />

          <div className="text-xs text-text-tertiary text-right">
            {t("app.version")}: {appConfig.version}
          </div>
        </div>
      </div>
    </div>
  );
}
