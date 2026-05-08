export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: number;
  backgroundImage?: string;
  audio?: string;
  isStreaming?: boolean;
}
