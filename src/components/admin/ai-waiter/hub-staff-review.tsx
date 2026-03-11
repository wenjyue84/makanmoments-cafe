"use client";

type AiWaiterStatus = {
  rateLimitPerMin: number;
  rateLimitPerDay: number;
};

interface Props {
  hubStatus: AiWaiterStatus | null;
}

export function HubStaffReview({ hubStatus }: Props) {
  const perMin = hubStatus?.rateLimitPerMin ?? 10;
  const perDay = hubStatus?.rateLimitPerDay ?? 100;
  const avgMsgs = 5;
  const capacity = Math.floor(perDay / avgMsgs);

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Staff Review
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Privacy policy and session statistics for customer interactions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Privacy card */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: "#f0fdf4", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🔒</span>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#166534", margin: 0 }}>
              No Conversation Logging — Privacy by Design
            </h3>
          </div>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem", color: "#475569", lineHeight: 1.65 }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "#1e293b" }}>Customer conversations are never stored.</strong> The AI Waiter processes each message in real time and discards it immediately after responding.
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <li>No chat logs are written to the database</li>
                <li>No conversation history is saved server-side (session context is client-side only)</li>
                <li>Groq and OpenRouter process messages per their respective privacy policies</li>
                <li>No personal identifiers are sent to AI APIs (message text only)</li>
                <li>Rate limit counters are stored in memory and reset on server restart</li>
              </ul>
              <p style={{ margin: 0, padding: "0.75rem", background: "#f0fdf4", borderRadius: "0.5rem", color: "#166534", fontSize: "0.8125rem" }}>
                ✓ Compliant with minimal-data principles. No PDPA data subject access requests needed for AI chat data.
              </p>
            </div>
          </div>
        </div>

        {/* Session statistics */}
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span style={{ fontSize: "1.25rem" }}>📊</span>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Session Statistics
            </h3>
          </div>
          <div style={{ padding: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[
                { label: "Rate limit (per user)", value: `${perMin}/min`, sub: `${perDay}/day` },
                { label: "Est. sessions/day", value: `~${capacity}`, sub: `at ${avgMsgs} msgs/session` },
                { label: "Context window", value: "Last 10", sub: "messages per session" },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: "center", padding: "1rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0ea5e9" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>{stat.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.125rem" }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#fefce8", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "#854d0e", lineHeight: 1.6 }}>
              <strong>Note:</strong> Since no conversations are logged, these are capacity estimates only. Actual usage cannot be tracked without implementing analytics — which would require user consent under PDPA.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
