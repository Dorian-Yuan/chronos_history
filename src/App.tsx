import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout";
import { HomePage } from "@/pages/HomePage";
import { GamePage } from "@/pages/GamePage";
import { SettingsPanel } from "@/components/settings";
import { initLocale } from "@/i18n";
import { registerServiceWorker } from "@/lib/sw-register";
import { getAllSessions } from "@/lib/db";
import { useSessionStore } from "@/stores";
import { usePWA } from "@/hooks/usePWA";
import { useTranslation } from "@/hooks/useTranslation";
import { WifiOff, RefreshCw, Download } from "lucide-react";

function PWABanner() {
  const { canInstall, installApp, isUpdateAvailable, updateApp, isOffline } =
    usePWA();
  const { t } = useTranslation();

  if (isOffline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-accent-warning/15 px-4 py-2 text-center text-xs text-accent-warning">
        <WifiOff size={12} />
        {t("pwa.offlineNotice")}
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="flex items-center justify-center gap-2 bg-accent-info/15 px-4 py-2 text-center text-xs text-accent-info">
        <RefreshCw size={12} />
        {t("pwa.updateAvailable")}
        <button
          onClick={updateApp}
          className="font-medium underline underline-offset-2 active:scale-95 transition-transform"
        >
          {t("pwa.updateNow")}
        </button>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="flex items-center justify-center gap-2 bg-accent-primary/15 px-4 py-2 text-center text-xs text-accent-primary">
        <Download size={12} />
        {t("pwa.installPrompt")}
        <button
          onClick={installApp}
          className="font-medium underline underline-offset-2 active:scale-95 transition-transform"
        >
          {t("pwa.install")}
        </button>
      </div>
    );
  }

  return null;
}

export default function App() {
  const loadSessions = async () => {
    try {
      const sessions = await getAllSessions();
      useSessionStore.getState().setSessions(sessions);
    } catch (e) {
      console.warn("Failed to load sessions:", e);
    }
  };

  useEffect(() => {
    initLocale();
    registerServiceWorker();
    loadSessions();
  }, []);

  return (
    <HashRouter>
      <PWABanner />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:scenarioId" element={<GamePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </AppShell>
      <SettingsPanel />
    </HashRouter>
  );
}
