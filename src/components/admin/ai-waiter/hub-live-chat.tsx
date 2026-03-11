"use client";

import { SharedChat } from "./hub-shared-chat";

export function HubLiveChat() {
  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Live Chat
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.25rem", marginTop: 0 }}>
        Real-time chat with the AI Waiter — same experience as what customers see.
      </p>
      <SharedChat
        welcomeMessage="Chat with the AI Waiter here. This is the live endpoint — same as the customer-facing widget."
        style={{ height: "calc(100vh - 14rem)", minHeight: "400px" }}
      />
    </div>
  );
}
