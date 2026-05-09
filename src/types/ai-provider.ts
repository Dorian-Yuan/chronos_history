export interface AIProviderConfig {
  id: string;
  name: string;
  type: "openai-compatible" | "gemini";
  defaultBaseUrl: string;
  defaultModel: string;
  apiKeyPlaceholder: string;
  supportsStructuredOutput?: boolean;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  supportsStructuredOutput(): boolean;
  sendMessage(
    messages: AIMessage[],
    options?: AISendOptions,
  ): Promise<AIResponse>;
  validateConfig(): boolean;
  parseJSONResponse(content: string): unknown;
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
  responseSchema?: Record<string, unknown>;
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
