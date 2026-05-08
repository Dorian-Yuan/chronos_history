import type { WorldState, SimulationResponse, AIMessage } from "@/types";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { getScenario, getPromptTemplate, getAppConfig } from "@/config";

function buildSystemPrompt(
  currentWorldState: WorldState,
  scenarioId: string,
): string {
  const scenario = getScenario(scenarioId);
  const promptTemplate = scenario
    ? getPromptTemplate(scenario.promptTemplate)
    : null;

  if (promptTemplate) {
    return promptTemplate.systemPrompt.replace(
      "{worldState}",
      JSON.stringify(currentWorldState, null, 2),
    );
  }

  const appConfig = getAppConfig();
  const fallback =
    appConfig.fallbackSystemPrompt ||
    "You are the Chronos history simulation engine. Current world state:\n{worldState}\n\nSimulate the historical progression based on the player's strategy input. Return JSON format.";
  return fallback.replace(
    "{worldState}",
    JSON.stringify(currentWorldState, null, 2),
  );
}

export class SimulationEngine {
  private scenarioId: string;

  constructor(scenarioId: string) {
    this.scenarioId = scenarioId;
  }

  async simulateTurn(
    userInput: string,
    currentWorldState: WorldState,
    chatHistory: AIMessage[],
  ): Promise<SimulationResponse> {
    const settings = useSettingsStore.getState();
    const aiProviderSetting = settings.getAIProvider();
    if (!aiProviderSetting) {
      throw new Error("AI provider not configured");
    }

    const provider = createProvider(aiProviderSetting);
    const systemPrompt = buildSystemPrompt(currentWorldState, this.scenarioId);

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10),
      { role: "user", content: userInput },
    ];

    const response = await withRetry(() =>
      provider.sendMessage(messages, {
        responseFormat: "json",
        temperature: 0.7,
        maxTokens: 4096,
      }),
    );

    try {
      const parsed =
        provider instanceof Object && "parseJSONResponse" in provider
          ? (
              provider as { parseJSONResponse: (c: string) => unknown }
            ).parseJSONResponse(response.content)
          : JSON.parse(response.content);
      return this.validateAndFillResponse(
        parsed as Partial<SimulationResponse>,
      );
    } catch {
      return {
        narrative: response.content,
        worldStateUpdate: {},
        suggestedActions: [],
        cabinetDebate: { opinions: [], conflicts: [], consensus: null },
        hiddenEvents: [],
        revealedInfo: [],
      };
    }
  }

  async *streamSimulation(
    userInput: string,
    currentWorldState: WorldState,
    chatHistory: AIMessage[],
  ): AsyncIterable<string> {
    const settings = useSettingsStore.getState();
    const aiProviderSetting = settings.getAIProvider();
    if (!aiProviderSetting) {
      throw new Error("AI provider not configured");
    }

    const provider = createProvider(aiProviderSetting);
    const systemPrompt = buildSystemPrompt(currentWorldState, this.scenarioId);

    const messages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10),
      { role: "user", content: userInput },
    ];

    yield* provider.streamMessage(messages, {
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  private validateAndFillResponse(
    partial: Partial<SimulationResponse>,
  ): SimulationResponse {
    return {
      narrative: partial.narrative || "",
      worldStateUpdate: partial.worldStateUpdate || {},
      suggestedActions: partial.suggestedActions || [],
      cabinetDebate: partial.cabinetDebate || {
        opinions: [],
        conflicts: [],
        consensus: null,
      },
      hiddenEvents: partial.hiddenEvents || [],
      revealedInfo: partial.revealedInfo || [],
    };
  }
}
