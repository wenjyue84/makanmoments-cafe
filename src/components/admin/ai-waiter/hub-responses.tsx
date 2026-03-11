"use client";

import { useState, useEffect } from "react";
import type { ChatSettings } from "@/lib/chat/settings";

type AiWaiterStatus = {
  systemPromptPreview: string;
  systemPromptPrefixLength: number;
};

interface Props {
  hubStatus: AiWaiterStatus | null;
  hubSettings: ChatSettings | null;
}

export function HubResponses({ hubStatus, hubSettings }: Props) {
  const [prefix, setPrefix] = useState(hubSettings?.systemPromptPrefix ?? "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Sync when hubSettings loads
  useEffect(() => {
    if (hubSettings) setPrefix(hubSettings.systemPromptPrefix);
  }, [hubSettings]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/chat-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...hubSettings, systemPromptPrefix: prefix }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Responses
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Customize the system prompt that shapes how the AI Waiter responds.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Prefix editor */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1e293b", margin: "0 0 0.125rem 0" }}>
              System Prompt Prefix
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
              Prepended before the default instructions. Use for daily specials, promotions, or event overrides.
            </p>
          </div>
          <div style={{ padding: "1.25rem" }}>
            <textarea
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              rows={7}
              placeholder={"e.g. Today's special: Mango Sticky Rice (RM 8.90). Mention it if customers ask for dessert.\n\nNote: We are fully booked for walk-ins tonight — please direct customers to the pre-order system."}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #e2e8f0",
                fontSize: "0.875rem",
                fontFamily: "ui-monospace, monospace",
                color: "#1e293b",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {prefix.length} chars
              </span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {saveStatus === "saved" && (
                  <span style={{ fontSize: "0.8125rem", color: "#16a34a", fontWeight: 500 }}>✓ Saved</span>
                )}
                {saveStatus === "error" && (
                  <span style={{ fontSize: "0.8125rem", color: "#dc2626", fontWeight: 500 }}>Save failed</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "0.5rem 1.25rem",
                    background: "#0ea5e9",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save Prefix"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full prompt preview */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1e293b", margin: "0 0 0.125rem 0" }}>
              Full Prompt Preview
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
              First 600 characters of the compiled system prompt (read-only). The full prompt includes the knowledge base.
            </p>
          </div>
          <div style={{ padding: "1.25rem" }}>
            {hubStatus ? (
              <>
                <pre style={{
                  margin: 0,
                  padding: "1rem",
                  background: "#1e293b",
                  color: "#94a3b8",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontFamily: "ui-monospace, monospace",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                }}>
                  {hubStatus.systemPromptPreview}
                </pre>
                <div style={{ marginTop: "0.625rem", fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>
                  … (truncated — full prompt includes cafe facts, live menu from DB, and FAQ)
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "0.875rem", padding: "1rem", textAlign: "center" }}>
                Loading prompt preview…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
