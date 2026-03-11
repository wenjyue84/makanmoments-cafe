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

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.125rem" }}>{emoji}</span>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function KeyDot({ present, label }: { present: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: present ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ marginLeft: "auto", color: present ? "#16a34a" : "#dc2626", fontWeight: 600, fontSize: "0.75rem" }}>
        {present ? "Set" : "Missing"}
      </span>
    </div>
  );
}

function QuickCard({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.75rem 1.25rem",
        background: "#fff",
        border: "1.5px dashed #d1d5db",
        borderRadius: "0.75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        color: "#374151",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "#f0f9ff"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#fff"; }}
    >
      <span style={{ fontSize: "1.125rem" }}>{emoji}</span>
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
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Dashboard</h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        AI Waiter system overview and quick actions.
      </p>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <QuickCard emoji="💬" label="Chat Simulator" onClick={() => setActiveTab("chat-simulator")} />
        <QuickCard emoji="📚" label="Edit Knowledge" onClick={() => setActiveTab("understanding")} />
        <QuickCard emoji="⚙️" label="Settings" onClick={() => setActiveTab("settings")} />
      </div>

      {/* 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>

        {/* AI Model card */}
        <Card emoji="🤖" title="AI Model">
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
                <span style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>Llama 3.3 70B</span>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                Temperature: <strong style={{ color: "#111827" }}>{hubStatus.temperature.toFixed(1)}</strong>
              </div>
              <div style={{ paddingTop: "0.5rem", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <KeyDot present={hubStatus.groqKeyPresent} label="GROQ_API_KEY" />
                <KeyDot present={hubStatus.openrouterKeyPresent} label="OPENROUTER_API_KEY" />
              </div>
            </div>
          )}
        </Card>

        {/* Knowledge Base card */}
        <Card emoji="📚" title="Knowledge Base">
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
                    background: "#f9fafb",
                    border: "1px solid #f3f4f6",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f9fafb")}
                >
                  <span style={{ fontSize: "0.8125rem", color: "#374151", fontWeight: 500 }}>{f.name}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{f.sizeKb} KB</div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{formatDate(f.lastModified)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Rate Limits card */}
        <Card emoji="⚡" title="Rate Limits">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ textAlign: "center", padding: "0.875rem", background: "#f9fafb", borderRadius: "0.625rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0ea5e9" }}>{hubStatus.rateLimitPerMin}</div>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.125rem" }}>req / min</div>
                </div>
                <div style={{ textAlign: "center", padding: "0.875rem", background: "#f9fafb", borderRadius: "0.625rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0ea5e9" }}>{hubStatus.rateLimitPerDay}</div>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.125rem" }}>req / day</div>
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                Per IP · localhost exempt in dev
              </div>
            </div>
          )}
        </Card>

        {/* System Prompt card */}
        <Card emoji="📝" title="System Prompt">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                Prefix length:{" "}
                <strong style={{ color: "#111827" }}>
                  {hubStatus.systemPromptPrefixLength > 0
                    ? `${hubStatus.systemPromptPrefixLength} chars`
                    : "None (default only)"}
                </strong>
              </div>
              <div style={{
                padding: "0.625rem",
                background: "#f9fafb",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                color: "#6b7280",
                fontFamily: "monospace",
                lineHeight: 1.5,
                maxHeight: "6rem",
                overflow: "hidden",
                position: "relative",
              }}>
                {hubStatus.systemPromptPreview.slice(0, 200)}…
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2rem", background: "linear-gradient(transparent, #f9fafb)" }} />
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

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {[100, 75, 60].map(w => (
        <div key={w} style={{ height: "1rem", background: "#f3f4f6", borderRadius: "0.25rem", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}
