import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { getAIProviders } from "@/config";
import { getProviderDefaultConfig, createProvider } from "@/lib/ai";
import type { AIProviderSetting } from "@/types";
import {
  Check,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

type TestStatus = "idle" | "testing" | "success" | "error";

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
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const selectedProvider = providers.find((p) => p.id === providerId);

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
        [{ role: "user", content: "请回复：连接测试成功" }],
        { maxTokens: 20, temperature: 0 },
      );

      if (response.content) {
        setTestStatus("success");
        setTimeout(() => onComplete(), 600);
      } else {
        setTestStatus("error");
        setTestError("API 返回了空响应");
      }
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : "连接测试失败，请检查配置");
    }
  };

  const getBaseUrlHint = (): string => {
    if (selectedProvider?.type === "gemini") {
      return "例：https://generativelanguage.googleapis.com/v1beta";
    }
    return "例：https://api.openai.com/v1（需包含到 /v1）";
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-bg-primary px-6 noise-bg">
      <div className="absolute inset-0 ink-wash pointer-events-none" />

      <div className="relative w-full max-w-sm mx-auto animate-fade-in">
        {step === 0 && (
          <div className="text-center space-y-10">
            <div className="space-y-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-bg-tertiary/60 border border-border mb-2">
                <Sparkles size={30} className="text-accent-primary" />
              </div>
              <h1 className="font-display text-5xl font-bold tracking-[0.1em] text-text-primary">
                CHRONOS
              </h1>
              <p className="font-serif text-base text-text-secondary">
                {t("app.subtitle")}
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="btn-primary w-full max-w-[15rem] mx-auto text-base py-3"
            >
              {t("setup.getStarted")}
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 px-4">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-xl font-semibold text-text-primary">
                {t("setup.configureAI")}
              </h2>
            </div>

            <div className="space-y-5">
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
                    : "OpenAI 兼容 API 只需包含到 /v1"}
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
                        : t("setup.startJourney")}
                </span>
              </button>

              {testStatus === "error" && testError && (
                <div className="mt-3 rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2.5 text-xs text-red-400 leading-relaxed">
                  {testError}
                </div>
              )}

              {testStatus === "success" && (
                <div className="mt-3 rounded-lg border border-green-900/30 bg-green-900/10 px-4 py-2.5 text-xs text-green-400">
                  API 连接测试通过，即将进入...
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(0)}
              className="btn-ghost w-full justify-center mt-2"
            >
              {t("common.back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
