import type {
  AIProvider,
  AIMessage,
  AISendOptions,
  AIResponse,
} from "@/types/ai-provider";

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly name: string;

  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  abstract sendMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): Promise<AIResponse>;
  abstract validateConfig(): boolean;

  parseJSONResponse(content: string): unknown {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  }
}
