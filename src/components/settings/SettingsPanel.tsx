import { useState } from "react";
import { X, ChevronRight, Download, Upload, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/stores";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { AIProviderConfig } from "./AIProviderConfig";
import { getAppConfig } from "@/config";
import { getAvailableThemes, setTheme, getTheme } from "@/lib/theme";
import { exportAllData, importAllData } from "@/lib/game";

export function SettingsPanel() {
  const { t } = useTranslation();
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const isMobile = useUIStore((s) => s.isMobile);
  const appConfig = getAppConfig();
  const [currentTheme, setCurrentTheme] = useState(getTheme().name);
  const experimentalMode = useSettingsStore((s) => s.experimentalMode);
  const setExperimentalMode = useSettingsStore((s) => s.setExperimentalMode);
  const [aiConfigExpanded, setAiConfigExpanded] = useState(false);
  const [showImportBackupConfirm, setShowImportBackupConfirm] = useState(false);

  if (!settingsOpen) return null;

  const themes = getAvailableThemes();

  const handleExportBackup = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronos_full_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupConfirm = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.setAttribute("aria-label", "选择备份文件");
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      importAllData(text);
      setShowImportBackupConfirm(false);
    };
    input.click();
  };

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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium font-serif text-text-secondary">
              {t("settings.theme")}
            </span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {themes.map((th) => (
                <button
                  key={th.name}
                  onClick={() => {
                    setTheme(th.name);
                    setCurrentTheme(th.name);
                  }}
                  className={`px-3 py-1.5 text-xs font-serif transition-colors ${
                    currentTheme === th.name
                      ? "bg-accent-primary text-white"
                      : "bg-bg-secondary text-text-tertiary hover:bg-bg-hover"
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium font-serif text-text-secondary">
              实验模式
            </span>
            <button
              onClick={() => setExperimentalMode(!experimentalMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                experimentalMode ? "bg-accent-primary" : "bg-bg-tertiary"
              }`}
              role="switch"
              aria-checked={experimentalMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  experimentalMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="divider" />

          <div>
            <button
              onClick={() => setAiConfigExpanded(!aiConfigExpanded)}
              className="flex items-center justify-between w-full"
            >
              <span className="text-sm font-medium font-serif text-text-secondary">
                AI 配置
              </span>
              <ChevronRight
                size={16}
                className={`text-text-tertiary transition-transform duration-200 ${
                  aiConfigExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
            {aiConfigExpanded && (
              <div className="mt-3">
                <AIProviderConfig />
              </div>
            )}
          </div>

          <div className="divider" />

          <div>
            <div className="flex gap-3">
              <button
                onClick={handleExportBackup}
                className="btn-secondary flex-1 font-serif text-xs"
              >
                <Download size={12} /> 导出备份
              </button>
              <button
                onClick={() => setShowImportBackupConfirm(true)}
                className="btn-secondary flex-1 font-serif text-xs"
              >
                <Upload size={12} /> 导入备份
              </button>
            </div>
          </div>

          {showImportBackupConfirm && (
            <div className="rounded-lg border border-status-warning-border bg-status-warning-bg px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="shrink-0 text-accent-secondary mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-xs font-serif text-text-primary">
                    导入备份将彻底覆盖本地所有数据，确定继续吗？
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setShowImportBackupConfirm(false)}
                      className="btn-ghost px-3 py-1 text-xs font-serif"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleImportBackupConfirm}
                      className="rounded-lg bg-accent-danger px-3 py-1 text-xs text-white font-serif hover:opacity-90 active:scale-95 transition-all"
                    >
                      确认导入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-right text-[10px] text-text-tertiary pt-2">
            {t("app.version")}: {appConfig.version}
          </div>
        </div>
      </div>
    </div>
  );
}
