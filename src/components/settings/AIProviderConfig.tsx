import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getAIProviders } from "@/config";
import { getProviderDefaultConfig, createProvider } from "@/lib/ai";
import type { AIProviderSetting } from "@/types";
import { Check, Loader2, AlertCircle } from "lucide-react";

type TestStatus = "idle" | "testing" | "success" | "error";

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
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const handleProviderChange = (id: string) => {
    setProviderId(id);
    const defaults = getProviderDefaultConfig(id);
    setBaseUrl(defaults.baseUrl || "");
    setModel(defaults.model || "");
    setTestStatus("idle");
    setTestError(null);
  };

  const handleSaveAndTest = async () => {
    const setting: AIProviderSetting = {
      providerId,
      apiKey,
      baseUrl,
      model,
    };
    setAIProvider(setting);

    setTestStatus("testing");
    setTestError(null);

    try {
      const provider = createProvider(setting);
      if (!provider.validateConfig()) {
        setTestStatus("error");
        setTestError("配置不完整，请检查 API Key 和 Base URL");
        return;
      }

      const response = await provider.sendMessage(
        [
          {
            role: "user",
            content: "请回复：连接测试成功",
          },
        ],
        {
          maxTokens: 20,
          temperature: 0,
        },
      );

      if (response.content) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
        setTestError("API 返回了空响应");
      }
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : "连接测试失败，请检查配置");
    }
  };

  const selectedProvider = providers.find((p) => p.id === providerId);

  const getBaseUrlHint = (): string => {
    if (selectedProvider?.type === "gemini") {
      return "例：https://generativelanguage.googleapis.com/v1beta";
    }
    return "例：https://api.openai.com/v1（需包含到 /v1）";
  };

  return (
    <div className="space-y-5">
      <div className="section-label mb-1">{t("settings.apiConfig")}</div>

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
          onChange={(e) => {
            setApiKey(e.target.value);
            setTestStatus("idle");
          }}
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
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setTestStatus("idle");
          }}
          placeholder={getBaseUrlHint()}
          className="input-field"
        />
        <p className="mt-1.5 text-[11px] text-text-tertiary leading-relaxed">
          {selectedProvider?.type === "gemini"
            ? "Gemini API 地址通常到 /v1beta 即可"
            : "OpenAI 兼容接口地址需包含到 /v1，无需包含 /chat/completions"}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          {t("settings.model")}
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setTestStatus("idle");
          }}
          placeholder={t("settings.selectModel")}
          className="input-field"
        />
      </div>

      <div className="pt-4">
        <button
          onClick={handleSaveAndTest}
          disabled={!apiKey.trim() || testStatus === "testing"}
          className={`btn-primary w-full ${
            testStatus === "success"
              ? "!bg-accent-success"
              : testStatus === "error"
                ? "!bg-accent-danger"
                : ""
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="flex items-center justify-center gap-2">
            {testStatus === "testing" && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {testStatus === "success" && <Check size={14} />}
            {testStatus === "error" && <AlertCircle size={14} />}
            {testStatus === "testing"
              ? "测试中..."
              : testStatus === "success"
                ? "连接成功"
                : testStatus === "error"
                  ? "保存并重试"
                  : "保存并测试"}
          </span>
        </button>

        {testStatus === "error" && testError && (
          <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2.5 text-xs text-red-400 leading-relaxed">
            {testError}
          </div>
        )}

        {testStatus === "success" && (
          <div className="mt-3 rounded-lg border border-green-900/30 bg-green-900/10 px-4 py-2.5 text-xs text-green-400">
            API 连接测试通过，配置已保存
          </div>
        )}
      </div>
    </div>
  );
}
