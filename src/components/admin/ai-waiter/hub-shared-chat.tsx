"use client";

import { useState, useRef, useImperativeHandle, forwardRef, type CSSProperties } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };

export interface SharedChatHandle {
  sendMessage(text: string): void;
}

interface Props {
  welcomeMessage?: string;
  style?: CSSProperties;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const SharedChat = forwardRef<SharedChatHandle, Props>(
  function SharedChat({ welcomeMessage, style }, ref) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    // Always-fresh reference to messages for useImperativeHandle closure
    const msgRef = useRef<Message[]>([]);
    msgRef.current = messages;

    async function sendMessage(text: string) {
      const userMsg: Message = { id: uid(), role: "user", content: text };
      const assistantId = uid();

      setMessages(prev => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      // Build UIMessage array from current messages + new user message
      const history = msgRef.current;
      const uiMessages = [...history, userMsg].map(m => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: uiMessages }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";

          for (const part of parts) {
            if (!part.trim()) continue;
            const dataLine = part.split("\n").find(l => l.startsWith("data: "));
            if (!dataLine) continue;
            const raw = dataLine.slice(6);
            if (raw === "[DONE]") { setIsLoading(false); return; }
            try {
              const ev = JSON.parse(raw);
              if (ev.type === "text-delta") {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: m.content + ev.textDelta } : m
                  )
                );
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              } else if (ev.type === "finish") {
                setIsLoading(false);
                return;
              } else if (ev.type === "error") {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: `⚠️ ${ev.errorText || "AI error"}` }
                      : m
                  )
                );
                setIsLoading(false);
                return;
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: "⚠️ Failed to connect to AI service." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    }

    useImperativeHandle(ref, () => ({ sendMessage }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage(input.trim());
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden", ...style }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {messages.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "3rem 1rem" }}>
              {welcomeMessage || "Type a message to start chatting with the AI waiter."}
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%",
                padding: "0.625rem 0.875rem",
                borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                background: msg.role === "user" ? "#0ea5e9" : "#f1f5f9",
                color: msg.role === "user" ? "#fff" : "#1e293b",
                fontSize: "0.875rem",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content || (isLoading && msg.role === "assistant" ? "▌" : "")}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ padding: "0.75rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.5rem", background: "#f8fafc" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              fontSize: "0.875rem",
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "0.5rem 1rem",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              opacity: isLoading || !input.trim() ? 0.55 : 1,
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "opacity 0.15s",
            }}
          >
            {isLoading ? "…" : "Send"}
          </button>
        </form>
      </div>
    );
  }
);
