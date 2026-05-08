export interface AIProviderConfig {
  id: string;
  name: string;
  type: "openai-compatible" | "gemini";
  defaultBaseUrl: string;
  defaultModel: string;
  supportsStreaming: boolean;
  apiKeyPlaceholder: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  sendMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): Promise<AIResponse>;
  streamMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): AsyncIterable<string>;
  validateConfig(): boolean;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AISendOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderSetting {
  providerId: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}
