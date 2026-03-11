"use client";

import { SharedChat } from "./hub-shared-chat";

export function HubLiveChat() {
  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
        Live Chat
      </h2>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        Real-time chat with the AI Waiter — same experience as what customers see.
      </p>
      <SharedChat
        welcomeMessage="Chat with the AI Waiter here. This is the live endpoint — same as the customer-facing widget."
        style={{ height: "calc(100vh - 14rem)", minHeight: "400px" }}
      />
    </div>
  );
}
