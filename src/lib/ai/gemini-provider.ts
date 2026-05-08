import { BaseAIProvider } from "./base-provider";
import type { AIMessage, AISendOptions, AIResponse } from "@/types/ai-provider";

export class GeminiProvider extends BaseAIProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini";

  constructor(apiKey: string, baseUrl: string, model: string) {
    super(apiKey, baseUrl, model);
  }

  validateConfig(): boolean {
    return !!(this.apiKey && this.model);
  }

  private convertMessages(
    messages: AIMessage[],
  ): { role: string; parts: { text: string }[] }[] {
    return messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
  }

  async sendMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): Promise<AIResponse> {
    const url = `${this.baseUrl}/models/${options?.model || this.model}:generateContent?key=${this.apiKey}`;

    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 4096,
    };

    if (options?.responseFormat === "json") {
      generationConfig.responseMimeType = "application/json";
    }

    if (options?.responseSchema && options?.responseFormat === "json") {
      generationConfig.responseSchema = options.responseSchema;
    }

    const body = {
      contents: this.convertMessages(messages),
      generationConfig,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      content,
      model: this.model,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }
}
