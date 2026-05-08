import aiProvidersConfig from "./ai-providers.json";
import worldStateFieldsConfig from "./world-state-fields.json";
import advisorsConfig from "./advisors.json";
import appConfig from "./app.json";
import springAutumnScenario from "./scenarios/spring-autumn.json";
import springAutumnPrompt from "./prompt-templates/spring-autumn.json";
import type { AIProviderConfig } from "@/types/ai-provider";
import type { ScenarioConfig } from "@/types/scenario";

export function getAIProviders(): AIProviderConfig[] {
  return aiProvidersConfig.providers as AIProviderConfig[];
}

export function getWorldStateFields() {
  return worldStateFieldsConfig;
}

export function getAdvisors() {
  return advisorsConfig.advisors;
}

export function getAppConfig() {
  return appConfig;
}

const scenarioMap: Record<string, ScenarioConfig> = {
  "spring-autumn": springAutumnScenario as ScenarioConfig,
};

const promptTemplateMap: Record<string, typeof springAutumnPrompt> = {
  "spring-autumn": springAutumnPrompt,
};

export function getScenarios(): ScenarioConfig[] {
  return Object.values(scenarioMap);
}

export function getScenario(id: string): ScenarioConfig | undefined {
  return scenarioMap[id];
}

export function getPromptTemplate(templateId: string) {
  return promptTemplateMap[templateId];
}

export function registerScenario(scenario: ScenarioConfig): void {
  scenarioMap[scenario.id] = scenario;
}
