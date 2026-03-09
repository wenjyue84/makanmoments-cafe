"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { X, Send, MessageCircle } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import { ChatBubble } from "./chat-bubble";

interface ChatPanelProps {
  onClose: () => void;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function ChatPanel({ onClose }: ChatPanelProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const { addItem } = useTray();
  const handledToolCalls = useRef(new Set<string>());

  const welcomeText = t("welcome");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: welcomeText }],
      },
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Process tool calls (AI SDK v6: tool calls are in msg.parts)
    messages.forEach((msg: any) => {
      if (msg.parts) {
        msg.parts.forEach((part: any) => {
          if (
            part.type === "tool-invocation" &&
            part.toolInvocation?.toolName === "addToTray" &&
            (part.toolInvocation?.state === "call" ||
              part.toolInvocation?.state === "result") &&
            !handledToolCalls.current.has(part.toolInvocation?.toolCallId)
          ) {
            handledToolCalls.current.add(part.toolInvocation.toolCallId);
            const { id, name, price } = part.toolInvocation.args;
            addItem({ id, name, price });
          }
        });
      }
    });
  }, [messages, addItem]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
        <div>
          <h3 className="font-semibold text-primary-foreground">
            {t("title")}
          </h3>
          <p className="text-xs text-primary-foreground/70">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-1">
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground"
              aria-label="Order via WhatsApp"
              title="Order via WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1 text-primary-foreground/70 hover:text-primary-foreground"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => {
          const text =
            msg.parts
              ?.filter(
                (p: any): p is { type: "text"; text: string } => p.type === "text"
              )
              .map((p: any) => p.text)
              .join("") ?? "";

          const hasPureToolCall =
            !text &&
            msg.parts?.some((p: any) => p.type === "tool-invocation");
          if (hasPureToolCall) return null; // hide pure tool calls with no text

          return (
            <ChatBubble key={msg.id} role={msg.role} content={text} />
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">{t("error")}</p>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
