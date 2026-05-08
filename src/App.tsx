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

function PWABanner() {
  const { canInstall, installApp, isUpdateAvailable, updateApp, isOffline } =
    usePWA();
  const { t } = useTranslation();

  if (isOffline) {
    return (
      <div className="bg-accent-warning/20 px-4 py-2 text-center text-xs text-accent-warning">
        {t("pwa.offlineNotice")}
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="bg-accent-info/20 px-4 py-2 text-center text-xs text-accent-info flex items-center justify-center gap-2">
        {t("pwa.updateAvailable")}
        <button onClick={updateApp} className="underline font-medium">
          {t("pwa.updateNow")}
        </button>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="bg-accent-primary/20 px-4 py-2 text-center text-xs text-accent-primary flex items-center justify-center gap-2">
        {t("pwa.installPrompt")}
        <button onClick={installApp} className="underline font-medium">
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
