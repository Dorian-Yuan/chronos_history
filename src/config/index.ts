import aiProvidersConfig from "./ai-providers.json";
import appConfig from "./app.json";
import type { AIProviderConfig } from "@/types/ai-provider";

export function getAIProviders(): AIProviderConfig[] {
  return aiProvidersConfig.providers as AIProviderConfig[];
}

export function getAppConfig() {
  return appConfig;
}