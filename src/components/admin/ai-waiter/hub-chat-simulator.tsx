"use client";

import { useRef } from "react";
import { SharedChat, type SharedChatHandle } from "./hub-shared-chat";

const PRESETS = [
  "Is the food halal?",
  "What time do you open?",
  "Recommend something under RM15",
  "What noodle dishes do you have?",
  "I want to order Pad Thai",
  "What's the WiFi password?",
];

export function HubChatSimulator() {
  const chatRef = useRef<SharedChatHandle>(null);

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
        Chat Simulator
      </h2>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        Test the AI Waiter with preset questions or type your own.
      </p>

      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 14rem)", minHeight: "450px" }}>
        {/* Chat — 70% */}
        <div style={{ flex: "0 0 70%", minWidth: 0 }}>
          <SharedChat
            ref={chatRef}
            welcomeMessage="Test mode — type a message as if you're a customer, or click a preset on the right."
            style={{ height: "100%" }}
          />
        </div>

        {/* Preset panel — 30% */}
        <div style={{ flex: "0 0 calc(30% - 1rem)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ padding: "0.875rem 1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.875rem 0" }}>
              Preset Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {PRESETS.map(q => (
                <button
                  key={q}
                  onClick={() => chatRef.current?.sendMessage(q)}
                  style={{
                    padding: "0.625rem 0.875rem",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    fontSize: "0.8125rem",
                    color: "#374151",
                    cursor: "pointer",
                    textAlign: "left",
                    lineHeight: 1.4,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.borderColor = "#0ea5e9"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "0.75rem 1rem", background: "#f0f9ff", borderRadius: "0.5rem", border: "1px solid #bae6fd", fontSize: "0.75rem", color: "#0369a1", lineHeight: 1.6 }}>
            Clicking a preset sends it directly to the AI — same as a customer typing it.
          </div>
        </div>
      </div>
    </div>
  );
}
