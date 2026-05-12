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

  const handleProviderChange = (id: string) => {
    setProviderId(id);
    const defaults = getProviderDefaultConfig(id);
    setBaseUrl(defaults.baseUrl || "");
    setModel(defaults.model || "");
    setTestStatus("idle");
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

    try {
      const provider = createProvider(setting);
      if (!provider.validateConfig()) {
        setTestStatus("error");
        alert("配置不完整");
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
        alert("空响应");
      }
    } catch (e) {
      setTestStatus("error");
      alert(e instanceof Error ? e.message : "连接失败");
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
      <div className="section-label">{t("settings.apiConfig")}</div>

      <div>
        <label className="mb-3 block text-sm font-medium font-serif text-text-secondary">
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
        <label className="mb-3 block text-sm font-medium font-serif text-text-secondary">
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
        <label className="mb-3 block text-sm font-medium font-serif text-text-secondary">
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
        <p className="mt-1.5 text-xs text-text-tertiary leading-relaxed">
          {selectedProvider?.type === "gemini"
            ? "Gemini API 地址通常到 /v1beta 即可"
            : "OpenAI 兼容 API 只需包含到 /v1"}
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium font-serif text-text-secondary">
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

      <div className="pt-6">
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
      </div>
    </div>
  );
}
