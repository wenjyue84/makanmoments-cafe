"use client";

type KnowledgeFile = { slug: string; name: string; sizeKb: number; lastModified: string };

type AiWaiterStatus = {
  model: "groq" | "openrouter";
  temperature: number;
  systemPromptPrefixLength: number;
  systemPromptPreview: string;
  knowledgeFiles: KnowledgeFile[];
  groqKeyPresent: boolean;
  openrouterKeyPresent: boolean;
  rateLimitPerMin: number;
  rateLimitPerDay: number;
};

interface Props {
  hubStatus: AiWaiterStatus | null;
  setActiveTab: (tab: string) => void;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</h3>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function KeyDot({ present, label }: { present: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: present ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ marginLeft: "auto", color: present ? "#16a34a" : "#dc2626", fontWeight: 600, fontSize: "0.75rem" }}>
        {present ? "Set" : "Missing"}
      </span>
    </div>
  );
}

function QuickBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: "#374151",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#e2e8f0")}
      onMouseLeave={e => (e.currentTarget.style.background = "#f1f5f9")}
    >
      {label}
    </button>
  );
}

export function HubDashboard({ hubStatus, setActiveTab }: Props) {
  const loading = !hubStatus;

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>Dashboard</h2>
      <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        AI Waiter system overview.
      </p>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <QuickBtn label="💬 Open Chat Simulator" onClick={() => setActiveTab("chat-simulator")} />
        <QuickBtn label="📚 Edit Knowledge" onClick={() => setActiveTab("understanding")} />
        <QuickBtn label="⚙️ Settings" onClick={() => setActiveTab("settings")} />
      </div>

      {/* 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>

        {/* AI Model card */}
        <Card title="AI Model">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                }}>
                  {hubStatus.model === "groq" ? "Groq" : "OpenRouter"}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>Llama 3.3 70B</span>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                Temperature: <strong style={{ color: "#1e293b" }}>{hubStatus.temperature.toFixed(1)}</strong>
              </div>
              <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <KeyDot present={hubStatus.groqKeyPresent} label="GROQ_API_KEY" />
                <KeyDot present={hubStatus.openrouterKeyPresent} label="OPENROUTER_API_KEY" />
              </div>
            </div>
          )}
        </Card>

        {/* Knowledge Base card */}
        <Card title="Knowledge Base">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {hubStatus.knowledgeFiles.map(f => (
                <button
                  key={f.slug}
                  onClick={() => setActiveTab("understanding")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.625rem",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f8fafc")}
                >
                  <span style={{ fontSize: "0.8125rem", color: "#374151", fontWeight: 500 }}>{f.name}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{f.sizeKb} KB</div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{formatDate(f.lastModified)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Rate Limits card */}
        <Card title="Rate Limits">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <RateRow label="Per minute (per IP)" value={`${hubStatus.rateLimitPerMin} requests`} />
              <RateRow label="Per day (per IP)" value={`${hubStatus.rateLimitPerDay} requests`} />
              <RateRow label="Localhost" value="Exempt in dev" />
              <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                Configured in src/lib/chat/rate-limit.ts
              </div>
            </div>
          )}
        </Card>

        {/* System Prompt card */}
        <Card title="System Prompt">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                Prefix length:{" "}
                <strong style={{ color: "#1e293b" }}>
                  {hubStatus.systemPromptPrefixLength > 0
                    ? `${hubStatus.systemPromptPrefixLength} chars`
                    : "None (default only)"}
                </strong>
              </div>
              <div style={{
                padding: "0.625rem",
                background: "#f8fafc",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
                fontFamily: "monospace",
                lineHeight: 1.5,
                maxHeight: "6rem",
                overflow: "hidden",
                position: "relative",
              }}>
                {hubStatus.systemPromptPreview.slice(0, 200)}…
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2rem", background: "linear-gradient(transparent, #f8fafc)" }} />
              </div>
              <button
                onClick={() => setActiveTab("responses")}
                style={{ alignSelf: "flex-start", fontSize: "0.8125rem", color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
              >
                Edit prompt →
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1e293b" }}>{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {[100, 75, 60].map(w => (
        <div key={w} style={{ height: "1rem", background: "#f1f5f9", borderRadius: "0.25rem", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}
