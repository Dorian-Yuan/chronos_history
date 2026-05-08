import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getAIProviders } from "@/config";
import { getProviderDefaultConfig } from "@/lib/ai";
import type { AIProviderSetting } from "@/types";

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
  };

  const selectedProvider = providers.find((p) => p.id === providerId);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-text-secondary">
        {t("settings.apiConfig")}
      </h3>

      <div>
        <label className="block text-xs text-text-tertiary mb-1">
          {t("settings.aiProvider")}
        </label>
        <select
          value={providerId}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1">
          {t("settings.apiKey")}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            selectedProvider?.apiKeyPlaceholder || t("settings.enterApiKey")
          }
          className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1">
          {t("settings.baseUrl")}
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={t("settings.enterBaseUrl")}
          className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-text-tertiary mb-1">
          {t("settings.model")}
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={t("settings.selectModel")}
          className="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90 transition-opacity"
      >
        {t("settings.save")}
      </button>
    </div>
  );
}
