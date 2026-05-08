import { BaseAIProvider } from "./base-provider";
import type { AIMessage, AISendOptions, AIResponse } from "@/types/ai-provider";

export class OpenAICompatibleProvider extends BaseAIProvider {
  readonly id: string;
  readonly name: string;

  constructor(
    id: string,
    name: string,
    apiKey: string,
    baseUrl: string,
    model: string,
  ) {
    super(apiKey, baseUrl, model);
    this.id = id;
    this.name = name;
  }

  validateConfig(): boolean {
    return !!(this.apiKey && this.baseUrl && this.model);
  }

  async sendMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): Promise<AIResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const useStructuredOutput =
      options?.responseSchema && options?.responseFormat === "json";

    const body: Record<string, unknown> = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    };

    if (useStructuredOutput && options.responseSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          strict: true,
          schema: options.responseSchema,
        },
      };
    } else if (options?.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model || this.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
