"use client";

type AiWaiterStatus = {
  model: "groq" | "openrouter";
  groqKeyPresent: boolean;
  openrouterKeyPresent: boolean;
};

interface Props {
  hubStatus: AiWaiterStatus | null;
}

function KeyBadge({ present }: { present: boolean }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      padding: "0.15rem 0.5rem",
      borderRadius: "9999px",
      fontSize: "0.7rem",
      fontWeight: 600,
      background: present ? "#dcfce7" : "#fee2e2",
      color: present ? "#166534" : "#991b1b",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: present ? "#22c55e" : "#ef4444", display: "inline-block" }} />
      {present ? "API key set" : "Key missing"}
    </span>
  );
}

function ModelBox({
  name,
  desc,
  label,
  keyPresent,
  isActive,
  isPrimary,
}: {
  name: string;
  desc: string;
  label: string;
  keyPresent: boolean;
  isActive: boolean;
  isPrimary: boolean;
}) {
  return (
    <div style={{
      flex: 1,
      border: `2px solid ${isActive ? "#0ea5e9" : "#e2e8f0"}`,
      borderRadius: "1rem",
      padding: "1.25rem",
      background: isActive ? "#f0f9ff" : "#fff",
      position: "relative",
    }}>
      {isPrimary && (
        <span style={{
          position: "absolute",
          top: "-0.625rem",
          left: "1rem",
          padding: "0.15rem 0.625rem",
          background: "#0ea5e9",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 700,
          borderRadius: "9999px",
        }}>
          {isActive ? "PRIMARY (Active)" : "PRIMARY"}
        </span>
      )}
      {!isPrimary && (
        <span style={{
          position: "absolute",
          top: "-0.625rem",
          left: "1rem",
          padding: "0.15rem 0.625rem",
          background: "#94a3b8",
          color: "#fff",
          fontSize: "0.7rem",
          fontWeight: 700,
          borderRadius: "9999px",
        }}>
          {isActive ? "FALLBACK (Active)" : "FALLBACK"}
        </span>
      )}
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>{name}</div>
      <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.75rem" }}>{desc}</div>
      <KeyBadge present={keyPresent} />
      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#94a3b8" }}>{label}</div>
    </div>
  );
}

export function HubSmartRouting({ hubStatus }: Props) {
  const activeModel = hubStatus?.model ?? "groq";
  const groqKey = hubStatus?.groqKeyPresent ?? false;
  const orKey = hubStatus?.openrouterKeyPresent ?? false;

  const groqActive = activeModel === "groq";
  const orActive = activeModel === "openrouter";

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Smart Routing
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Automatic fallback chain — if the primary model fails or hits rate limits, the system silently switches to the backup.
      </p>

      {/* Routing diagram */}
      <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {/* Customer */}
          <div style={{ textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: "2rem" }}>👤</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>Customer</div>
          </div>

          <Arrow />

          {/* /api/chat */}
          <div style={{
            padding: "0.75rem 1rem",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#475569",
            fontFamily: "monospace",
          }}>
            POST /api/chat
          </div>

          <Arrow />

          {/* Models */}
          <div style={{ flex: 1, display: "flex", gap: "1rem", minWidth: 300 }}>
            <ModelBox
              name="Groq"
              desc="Llama 3.3 70B Versatile"
              label="Free tier · 14,400 calls/day"
              keyPresent={groqKey}
              isActive={groqActive}
              isPrimary={activeModel === "groq"}
            />

            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
              <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600 }}>FALLBACK</div>
              <svg width="24" height="16" fill="none" viewBox="0 0 24 16">
                <path d="M0 8h20M14 2l6 6-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <ModelBox
              name="OpenRouter"
              desc="Llama 3.3 70B Instruct"
              label="Pay-per-token · No rate limit"
              keyPresent={orKey}
              isActive={orActive}
              isPrimary={activeModel === "openrouter"}
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", padding: "0.875rem 1rem", background: "#f0f9ff", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "#0369a1", lineHeight: 1.6 }}>
          <strong>How fallback works:</strong> The server streams from the primary model. If a{" "}
          <code style={{ background: "#dbeafe", padding: "0.1rem 0.25rem", borderRadius: "0.25rem" }}>&#123;&quot;type&quot;:&quot;error&quot;&#125;</code>{" "}
          SSE event is detected (e.g. Groq TPM/TPD limits), the stream is silently switched to the fallback model. The customer never sees an error.
        </div>
      </div>

      {/* Config hint */}
      <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", fontSize: "0.8125rem", color: "#4b5563" }}>
        To switch which model is primary, go to <strong>Settings → AI Model</strong>.
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="32" height="16" fill="none" viewBox="0 0 32 16" style={{ flexShrink: 0 }}>
      <path d="M0 8h28M22 2l6 6-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
