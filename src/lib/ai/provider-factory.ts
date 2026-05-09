import type { AIProvider, AIProviderSetting } from "@/types/ai-provider";
import { getAIProviders } from "@/config";
import { OpenAICompatibleProvider } from "./openai-provider";
import { GeminiProvider } from "./gemini-provider";

export function createProvider(setting: AIProviderSetting): AIProvider {
  const config = getAIProviders().find((p) => p.id === setting.providerId);
  if (!config) {
    throw new Error(`Unknown AI provider: ${setting.providerId}`);
  }

  switch (config.type) {
    case "openai-compatible":
      return new OpenAICompatibleProvider(
        config.id,
        config.name,
        setting.apiKey,
        setting.baseUrl || config.defaultBaseUrl,
        setting.model || config.defaultModel,
        config.supportsStructuredOutput ?? false,
      );
    case "gemini":
      return new GeminiProvider(
        setting.apiKey,
        setting.baseUrl || config.defaultBaseUrl,
        setting.model || config.defaultModel,
      );
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}

export function getProviderDefaultConfig(
  providerId: string,
): Partial<AIProviderSetting> {
  const config = getAIProviders().find((p) => p.id === providerId);
  if (!config) return {};
  return {
    providerId: config.id,
    baseUrl: config.defaultBaseUrl,
    model: config.defaultModel,
  };
}
