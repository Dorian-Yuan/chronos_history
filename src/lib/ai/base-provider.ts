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
  abstract supportsStructuredOutput(): boolean;

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

    try {
      return JSON.parse(cleaned);
    } catch {
      // fallback: extract JSON object from text
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const extracted = cleaned.slice(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(extracted);
        } catch {
          // extraction failed, fall through to error
        }
      }

      const preview =
        content.length > 100 ? content.slice(0, 100) + "..." : content;
      throw new Error(
        `AI 返回了无效的 JSON 格式。请检查 API 配置是否正确，或尝试更换模型。原始响应前100字：${preview}`,
      );
    }
  }
}
