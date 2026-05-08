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
    const body = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
      stream: false,
    };

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

  async *streamMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): AsyncIterable<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const body = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    };

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

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          continue;
        }
      }
    }
  }
}
