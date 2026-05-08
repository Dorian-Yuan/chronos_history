import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getAIProviders } from "@/config";
import { getProviderDefaultConfig } from "@/lib/ai";
import type { AIProviderSetting } from "@/types";
import { Check } from "lucide-react";

export function AIProviderConfig() {
  const { t } = useTranslation();
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const setAIProvider = useSettingsStore((s) => s.setAIProvider);
  const providers = getAIProviders();

  const [providerId, setProviderId] = useState(
    aiProvider?.providerId || providers[0]?.id || "",
  );
  const [apiKey, setApiKey] = useState(aiProvider?.apiKey || "");
  const [baseUrl, setBaseUrl] = useState(aiProvider?.baseUrl || "");
  const [model, setModel] = useState(aiProvider?.model || "");
  const [saved, setSaved] = useState(false);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = providers.find((p) => p.id === providerId);

  return (
    <div className="space-y-4">
      <div className="section-label">{t("settings.apiConfig")}</div>

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
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            selectedProvider?.apiKeyPlaceholder || t("settings.enterApiKey")
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

      <button
        onClick={handleSave}
        className={`touch-target w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
          saved
            ? "bg-accent-success text-text-inverse"
            : "bg-accent-primary text-text-inverse hover:opacity-90"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {saved && <Check size={14} />}
          {saved ? t("common.saved") || "Saved" : t("settings.save")}
        </span>
      </button>
    </div>
  );
}
