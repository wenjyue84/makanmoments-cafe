"use client";

type AiWaiterStatus = {
  model: "groq" | "openrouter";
  temperature: number;
  rateLimitPerMin: number;
  rateLimitPerDay: number;
  groqKeyPresent: boolean;
  openrouterKeyPresent: boolean;
};

interface Props {
  hubStatus: AiWaiterStatus | null;
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ color: "#64748b", fontSize: "0.875rem" }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}>{value}</span>
    </div>
  );
}

export function HubPerformance({ hubStatus }: Props) {
  const perMin = hubStatus?.rateLimitPerMin ?? 10;
  const perDay = hubStatus?.rateLimitPerDay ?? 100;
  const temp = hubStatus?.temperature ?? 0.7;
  const model = hubStatus?.model ?? "groq";

  const avgMsgsPerSession = 5;
  const dailyCapacity = Math.floor(perDay / avgMsgsPerSession);
  const groqFreeLimit = 14400;
  const groqCapacity = Math.floor(groqFreeLimit / avgMsgsPerSession);

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Performance
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Rate limits, capacity estimates, and model configuration.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <StatCard title="Rate Limit Config">
          <Row label="Per-minute limit (per IP)" value={`${perMin} requests/min`} />
          <Row label="Per-day limit (per IP)" value={`${perDay} requests/day`} />
          <Row label="Localhost exemption" value="Exempt in dev" />
          <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.75rem", background: "#f0f9ff", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "#0369a1" }}>
            Limits enforced in src/lib/chat/rate-limit.ts
          </div>
        </StatCard>

        <StatCard title="Estimated Daily Capacity">
          <Row label="Your rate limit (per user)" value={`${perDay} msgs/day`} />
          <Row label="Avg messages per session" value={`${avgMsgsPerSession} msgs`} />
          <Row label="Capacity (your rate limit)" value={`~${dailyCapacity} customer sessions/day`} />
          <Row label="Groq free tier limit" value={`${groqFreeLimit.toLocaleString()} API calls/day`} />
          <Row label="Capacity (Groq free tier)" value={`~${groqCapacity.toLocaleString()} customer sessions/day`} />
          <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "#166534" }}>
            Groq free tier supports far more than your user rate limit — you are not bottlenecked by the API.
          </div>
        </StatCard>

        <StatCard title="Current Model Configuration">
          <Row label="Active model" value={model === "groq" ? "Groq — Llama 3.3 70B Versatile" : "OpenRouter — Llama 3.3 70B Instruct"} />
          <Row label="Context window" value="128,000 tokens" />
          <Row label="Temperature" value={temp.toFixed(1)} />
          <Row label="Max conversation history" value="Last 10 messages" />
          <Row label="Max tool steps" value="3 per turn" />
        </StatCard>
      </div>
    </div>
  );
}
