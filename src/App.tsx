import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { GameProvider, useGameState } from "@/lib/game";
import { StartPage } from "@/pages/StartPage";
import { SelectionPage } from "@/pages/SelectionPage";
import { GamePage } from "@/pages/GamePage";
import { EndPage } from "@/pages/EndPage";
import { SettingsPanel } from "@/components/settings";
import { initLocale } from "@/i18n";
import { registerServiceWorker } from "@/lib/sw-register";
import { usePWA } from "@/hooks/usePWA";
import { useTranslation } from "@/hooks/useTranslation";
import { WifiOff, RefreshCw, Download } from "lucide-react";

function PWABanner() {
  const { canInstall, installApp, isUpdateAvailable, updateApp, isOffline } =
    usePWA();
  const { t } = useTranslation();

  if (isOffline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-900/20 px-4 py-2 text-center text-xs text-amber-400">
        <WifiOff size={12} />
        {t("pwa.offlineNotice")}
      </div>
    );
  }

  if (isUpdateAvailable) {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-900/20 px-4 py-2 text-center text-xs text-blue-400">
        <RefreshCw size={12} />
        {t("pwa.updateAvailable")}
        <button
          onClick={updateApp}
          className="font-medium underline underline-offset-2"
        >
          {t("pwa.updateNow")}
        </button>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-900/20 px-4 py-2 text-center text-xs text-amber-400">
        <Download size={12} />
        {t("pwa.installPrompt")}
        <button
          onClick={installApp}
          className="font-medium underline underline-offset-2"
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

export default function App() {
  useEffect(() => {
    initLocale();
    registerServiceWorker();
  }, []);

  return (
    <HashRouter>
      <GameProvider>
        <PWABanner />
        <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
          <GameRouter />
        </div>
        <SettingsPanel />
      </GameProvider>
    </HashRouter>
  );
}
