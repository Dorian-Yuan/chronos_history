import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedActions } from "./SuggestedActions";
import { useChatStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import { Scroll } from "lucide-react";

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
      <div className="flex-1 overflow-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-primary/8 border border-accent-primary/15">
                <Scroll size={28} className="text-accent-primary/60" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
                {t("app.title")}
              </h2>
              <p className="text-text-secondary max-w-xs mx-auto">
                {t("app.subtitle")}
              </p>
              <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
            </div>
          </div>
        )}
        <div className="space-y-1">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
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
