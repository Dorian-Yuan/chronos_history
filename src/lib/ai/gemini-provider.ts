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
    const body = {
      contents: this.convertMessages(messages),
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
        ...(options?.responseFormat === "json"
          ? { responseMimeType: "application/json" }
          : {}),
      },
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

  async *streamMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): AsyncIterable<string> {
    const url = `${this.baseUrl}/models/${options?.model || this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const body = {
      contents: this.convertMessages(messages),
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
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
        try {
          const parsed = JSON.parse(data);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) yield content;
        } catch {
          continue;
        }
      }
    }
  }
}
