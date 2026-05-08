import type { ChatMessage as ChatMessageType } from "@/types";
import ReactMarkdown from "react-markdown";
import { Scroll, User } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="my-4 flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-xs text-text-tertiary">{message.content}</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
    );
  }

  return (
    <div
      className={`my-3 flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-slide-up`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-accent-primary/15 text-accent-primary"
            : "bg-bg-tertiary text-text-tertiary"
        }`}
      >
        {isUser ? <User size={14} /> : <Scroll size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-accent-primary/12 border border-accent-primary/20 text-text-primary"
            : "bg-bg-card border border-border text-text-primary"
        }`}
      >
        <div
          className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed
          prose-p:my-1 prose-headings:my-2 prose-headings:text-text-primary prose-strong:text-text-primary
          prose-em:text-text-secondary prose-code:text-accent-primary prose-code:before:content-[''] prose-code:after:content-['']
          prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1 prose-blockquote:border-accent-primary/40 prose-blockquote:text-text-secondary
          prose-h1:text-base prose-h2:text-sm prose-h3:text-sm"
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && <span className="typing-cursor" />}
        </div>
        <div
          className={`mt-1.5 text-[10px] text-text-tertiary ${isUser ? "text-right" : ""}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
