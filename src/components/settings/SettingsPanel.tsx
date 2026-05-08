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
  const isMobile = useUIStore((s) => s.isMobile);
  const appConfig = getAppConfig();
  const [currentTheme, setCurrentTheme] = useState(getTheme().name);

  if (!settingsOpen) return null;

  const themes = getAvailableThemes();

  return (
    <div className="fixed inset-0 z-modal flex items-end md:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />
      <div
        className={`relative w-full max-w-lg rounded-t-2xl md:rounded-2xl border border-border bg-bg-secondary shadow-lg animate-slide-in-up md:animate-scale-in ${
          isMobile ? "max-h-[85vh]" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            {t("settings.title")}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="touch-target flex items-center justify-center rounded-xl p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto p-4 space-y-5 safe-bottom">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              {t("settings.language")}
            </label>
            <select
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value);
                setLocaleHook(e.target.value);
              }}
              className="w-full rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
            >
              {availableLocales.map((l) => (
                <option key={l} value={l}>
                  {l === "zh" ? "中文" : "English"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              {t("settings.theme")}
            </label>
            <select
              value={currentTheme}
              onChange={(e) => {
                setTheme(e.target.value);
                setCurrentTheme(e.target.value);
              }}
              className="w-full rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
            >
              {themes.map((th) => (
                <option key={th.name} value={th.name}>
                  {locale === "zh" ? th.label : th.labelEn}
                </option>
              ))}
            </select>
          </div>

          <AIProviderConfig />

          <div className="text-right text-[10px] text-text-tertiary">
            {t("app.version")}: {appConfig.version}
          </div>
        </div>
      </div>
    </div>
  );
}
