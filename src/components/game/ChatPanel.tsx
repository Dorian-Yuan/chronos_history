import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedActions } from "./SuggestedActions";
import { useChatStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";

export function ChatPanel() {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {t("app.title")}
              </h2>
              <p className="text-text-secondary">{t("app.subtitle")}</p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 py-2">
            <div className="typing-cursor text-text-secondary text-sm" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <SuggestedActions />
      <ChatInput />
    </div>
  );
}
