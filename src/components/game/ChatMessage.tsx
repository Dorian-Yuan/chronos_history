import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="my-4 text-center text-xs text-text-tertiary">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`my-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-accent-primary/20 text-text-primary"
            : "bg-bg-card text-text-primary"
        }`}
      >
        <div
          className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed
          prose-p:my-1 prose-headings:my-2 prose-headings:text-text-primary prose-strong:text-text-primary
          prose-em:text-text-secondary prose-code:text-accent-primary prose-code:before:content-[''] prose-code:after:content-['']
          prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-blockquote:border-accent-primary prose-blockquote:text-text-secondary
          prose-h1:text-base prose-h2:text-sm prose-h3:text-sm"
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && <span className="typing-cursor" />}
        </div>
      </div>
    </div>
  );
}
