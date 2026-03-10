"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { X, Send, MessageCircle, Mic } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import { ChatBubble } from "./chat-bubble";
import { cn } from "@/lib/utils";

const NUDGE_DELAY_MS = 3 * 60 * 1000; // 3 minutes

interface ChatPanelProps {
  onClose: () => void;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

// Check Web Speech API support once (browser-only)
const speechSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function ChatPanel({ onClose }: ChatPanelProps) {
  const t = useTranslations("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const { addItem } = useTray();
  const handledToolCalls = useRef(new Set<string>());
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const nudgeSentRef = useRef(false);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  const welcomeText = t("welcome");
  const nudgeText = t("nudge");
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

  const handleSubmitText = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      sendMessage({ text });
      setInput("");
    },
    [isLoading, sendMessage]
  );

  function toggleVoice() {
    if (!speechSupported) return;
    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Win = window as any;
      const SpeechRecognitionCtor =
        Win.SpeechRecognition || Win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      // Track final transcript within this recognition session
      const session = { transcript: "" };

      recognition.onstart = () => setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput(text);
        session.transcript = text;
      };

      recognition.onend = () => {
        setIsListening(false);
        if (session.transcript.trim()) {
          sendMessage({ text: session.transcript });
          setInput("");
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        session.transcript = "";
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  // Inactivity nudge: after NUDGE_DELAY_MS with no user message, send one gentle prompt
  const userMessageCount = messages.filter((m: any) => m.role === "user").length;
  useEffect(() => {
    if (nudgeSentRef.current) return;
    // Clear any pending timer when user sends a message
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }
    nudgeTimerRef.current = setTimeout(() => {
      if (!nudgeSentRef.current) {
        nudgeSentRef.current = true;
        setNudgeMessage(nudgeText);
      }
    }, NUDGE_DELAY_MS);
    return () => {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMessageCount]);

  // Auto-scroll on new messages + process tool calls
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
    handleSubmitText(input);
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
                (p: any): p is { type: "text"; text: string } =>
                  p.type === "text"
              )
              .map((p: any) => p.text)
              .join("") ?? "";

          const hasPureToolCall =
            !text && msg.parts?.some((p: any) => p.type === "tool-invocation");
          if (hasPureToolCall) return null;

          return <ChatBubble key={msg.id} role={msg.role} content={text} />;
        })}
        {nudgeMessage && (
          <ChatBubble role="assistant" content={nudgeMessage} />
        )}
        {isLoading && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{t("error")}</p>}
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
        {speechSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={isLoading}
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
              isListening
                ? "bg-red-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            aria-label={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening && (
              <span className="absolute inset-0 animate-ping rounded-lg bg-red-400 opacity-60" />
            )}
            <Mic className="relative h-4 w-4" />
          </button>
        )}
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
