import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { GameProvider, useGameState } from "@/lib/game";
import { StartPage } from "@/pages/StartPage";
import { SelectionPage } from "@/pages/SelectionPage";
import { GamePage } from "@/pages/GamePage";
import { EndPage } from "@/pages/EndPage";
import { SettingsPanel, WelcomeSetup } from "@/components/settings";
import { Toast } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initLocale } from "@/i18n";
import { registerServiceWorker } from "@/lib/sw-register";
import { usePWA } from "@/hooks/usePWA";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsStore } from "@/stores";
import { WifiOff, RefreshCw, Download } from "lucide-react";

function PWABanner() {
  const { canInstall, installApp, isUpdateAvailable, updateApp, isOffline } =
    usePWA();
  const { t } = useTranslation();

  if (isOffline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-status-warning-bg px-5 py-3 text-center text-xs text-status-warning-text border-b border-status-warning-border">
        <WifiOff size={13} />
        {t("pwa.offlineNotice")}
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="flex items-center justify-center gap-2 bg-status-info-bg px-5 py-3 text-center text-xs text-status-info-text border-b border-status-info-border">
        <RefreshCw size={13} />
        {t("pwa.updateAvailable")}
        <button
          onClick={updateApp}
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {t("pwa.updateNow")}
        </button>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="flex items-center justify-center gap-2 bg-status-warning-bg px-5 py-3 text-center text-xs text-status-warning-text border-b border-status-warning-border">
        <Download size={13} />
        {t("pwa.installPrompt")}
        <button
          onClick={installApp}
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {t("pwa.install")}
        </button>
      </div>
    );
  }

  return null;
}

function GameRouter() {
  const state = useGameState();
  const navigate = useNavigate();

  useEffect(() => {
    switch (state.phase) {
      case "start":
        navigate("/");
        break;
      case "selection":
        navigate("/selection");
        break;
      case "playing":
        navigate("/game");
        break;
      case "ended":
        navigate("/end");
        break;
    }
  }, [state.phase, navigate]);

  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/selection" element={<SelectionPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/end" element={<EndPage />} />
    </Routes>
  );
}

function AppContent() {
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const [setupComplete, setSetupComplete] = useState(
    () => !!aiProvider?.apiKey,
  );

  useSettingsStore.subscribe((state) => {
    if (state.aiProvider?.apiKey) {
      setSetupComplete(true);
    }
  });

  if (!setupComplete) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary">
        <WelcomeSetup onComplete={() => setSetupComplete(true)} />
      </div>
    );
  }

  return (
    <HashRouter>
      <GameProvider>
        <PWABanner />
        <div className="h-screen w-screen overflow-hidden bg-bg-primary text-text-primary noise-bg safe-top">
          <div className="absolute inset-0 ink-wash pointer-events-none" />
          <div className="relative z-10 h-full">
            <ErrorBoundary>
              <GameRouter />
            </ErrorBoundary>
          </div>
        </div>
        <SettingsPanel />
        <Toast />
      </GameProvider>
    </HashRouter>
  );
}

export default function App() {
  useEffect(() => {
    initLocale();
    registerServiceWorker();
  }, []);

  return <AppContent />;
}
