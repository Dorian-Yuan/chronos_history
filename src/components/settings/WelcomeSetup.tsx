import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getAIProviders } from "@/config";
import { getProviderDefaultConfig } from "@/lib/ai";
import type { AIProviderSetting } from "@/types";
import { Check, ChevronRight, Sparkles } from "lucide-react";

interface WelcomeSetupProps {
  onComplete: () => void;
}

export function WelcomeSetup({ onComplete }: WelcomeSetupProps) {
  const { t } = useTranslation();
  const setAIProvider = useSettingsStore((s) => s.setAIProvider);
  const providers = getAIProviders();

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState(providers[0]?.id || "");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");

  const selectedProvider = providers.find((p) => p.id === providerId);

  const handleProviderChange = (id: string) => {
    setProviderId(id);
    const defaults = getProviderDefaultConfig(id);
    setBaseUrl(defaults.baseUrl || "");
    setModel(defaults.model || "");
  };

  const handleSave = () => {
    const setting: AIProviderSetting = {
      providerId,
      apiKey,
      baseUrl,
      model,
    };
    setAIProvider(setting);
    onComplete();
  };

  const canProceed = step === 0 || (step === 1 && apiKey.trim().length > 0);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-bg-primary px-6 noise-bg">
      <div className="absolute inset-0 ink-wash pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-in">
        {step === 0 && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-bg-tertiary border border-border mb-2">
                <Sparkles size={36} className="text-accent-primary" />
              </div>
              <h1 className="font-display text-5xl font-bold tracking-wide text-text-primary">
                CHRONOS
              </h1>
              <p className="font-serif text-lg text-text-secondary">
                {t("app.subtitle")}
              </p>
            </div>

            <div className="space-y-3 text-left">
              <p className="text-sm text-text-secondary leading-relaxed">
                {t("setup.welcomeDescription")}
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="btn-primary w-full text-base py-3.5"
            >
              {t("setup.getStarted")}
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-xl font-semibold text-text-primary">
                {t("setup.configureAI")}
              </h2>
              <p className="text-sm text-text-tertiary">
                {t("setup.configureAIDescription")}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  {t("settings.aiProvider")}
                </label>
                <select
                  value={providerId}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="input-field"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  {t("settings.apiKey")}
                  <span className="text-accent-danger ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    selectedProvider?.apiKeyPlaceholder ||
                    t("settings.enterApiKey")
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  {t("settings.baseUrl")}
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={t("settings.enterBaseUrl")}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  {t("settings.model")}
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={t("settings.selectModel")}
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!canProceed}
              className="btn-primary w-full text-base py-3.5"
            >
              <Check size={18} />
              {t("setup.startJourney")}
            </button>

            <button
              onClick={() => setStep(0)}
              className="btn-ghost w-full justify-center"
            >
              {t("common.back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
