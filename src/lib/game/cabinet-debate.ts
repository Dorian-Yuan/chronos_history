import type {
  WorldState,
  CabinetDebate,
  AdvisorOpinion,
  AIMessage,
} from "@/types";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { getScenario, getPromptTemplate } from "@/config";

export async function generateCabinetDebate(
  userInput: string,
  currentWorldState: WorldState,
  scenarioId: string,
): Promise<CabinetDebate> {
  const settings = useSettingsStore.getState();
  const aiProviderSetting = settings.getAIProvider();
  if (!aiProviderSetting) {
    return { opinions: [], conflicts: [], consensus: null };
  }

  const provider = createProvider(aiProviderSetting);
  const scenario = getScenario(scenarioId);
  const promptTemplate = scenario
    ? getPromptTemplate(scenario.promptTemplate)
    : null;

  const debatePrompt = promptTemplate
    ? promptTemplate.cabinetDebatePrompt
        .replace("{userInput}", userInput)
        .replace("{worldState}", JSON.stringify(currentWorldState, null, 2))
    : `Based on current world state and player strategy: ${userInput}\n\nHave four advisors (economist, military, diplomat, public_sentiment) analyze this strategy from their perspectives.\n\nReturn JSON format with cabinetDebate object.`;

  const messages: AIMessage[] = [{ role: "system", content: debatePrompt }];

  try {
    const response = await withRetry(() =>
      provider.sendMessage(messages, {
        responseFormat: "json",
        temperature: 0.8,
        maxTokens: 2048,
      }),
    );

    const parsed = JSON.parse(response.content);
    if (parsed.cabinetDebate) {
      return parsed.cabinetDebate as CabinetDebate;
    }
    return parsed as CabinetDebate;
  } catch {
    return { opinions: [], conflicts: [], consensus: null };
  }
}

export function identifyConflicts(opinions: AdvisorOpinion[]): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < opinions.length; i++) {
    for (let j = i + 1; j < opinions.length; j++) {
      const a = opinions[i];
      const b = opinions[j];
      if (a.intervention && b.intervention) {
        const aWords = a.intervention.toLowerCase().split(/\s+/);
        const bWords = b.intervention.toLowerCase().split(/\s+/);
        const hasOpposite =
          aWords.some((w) =>
            b.intervention.toLowerCase().includes(`not ${w}`),
          ) ||
          bWords.some((w) => a.intervention.toLowerCase().includes(`not ${w}`));
        if (hasOpposite || Math.abs(a.confidence - b.confidence) > 40) {
          conflicts.push(
            `${a.advisor} vs ${b.advisor}: ${a.intervention} vs ${b.intervention}`,
          );
        }
      }
    }
  }
  return conflicts;
}
