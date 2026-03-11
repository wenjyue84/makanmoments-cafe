"use client";

const sections = [
  {
    title: "1. Architecture Overview",
    content: `The AI Waiter works as follows:

1. Knowledge files (knowledge/*.md) → loaded at startup into memory cache
2. Menu data → fetched live from Neon Postgres (60-min TTL cache)
3. System prompt → built by combining knowledge + prefix (if set)
4. Customer sends message → POST /api/chat → Groq API streams response
5. If Groq fails → automatic fallback to OpenRouter
6. Rate limiting → 10 requests/min, 100/day per IP (localhost exempt in dev)`,
  },
  {
    title: "2. API Key Setup",
    content: `Add these to your .env.local file:

GROQ_API_KEY=gsk_...          # Primary model (Groq, free tier)
OPENROUTER_API_KEY=sk-or-...  # Fallback model (OpenRouter)

Restart the dev server after adding keys.
Get Groq API key: https://console.groq.com
Get OpenRouter key: https://openrouter.ai`,
  },
  {
    title: "3. Updating Knowledge Files",
    content: `Go to the Understanding tab to edit the AI's knowledge base.

• cafe-facts.md — Hours, address, WiFi, ambiance, featured items
• faq.md — Frequently asked questions and answers
• menu-knowledge.md — Fallback menu (AI fetches live menu from DB)

After saving, the system prompt cache is automatically cleared and the AI will use the updated content on the next message.`,
  },
  {
    title: "4. Adjusting the System Prompt",
    content: `Go to Settings to add a custom prefix to the system prompt.

The prefix is prepended before the default AI waiter instructions. Use it to:
• Add today's specials or promotions
• Temporarily disable certain recommendations
• Add event-specific instructions (e.g. "We are fully booked tonight")

Leave blank to use the default prompt only.`,
  },
  {
    title: "5. Rate Limiting",
    content: `Rate limits apply per IP address:
• 10 requests per minute
• 100 requests per day

Limits are enforced in src/lib/chat/rate-limit.ts.
localhost (127.0.0.1) and ::1 are exempt in development.

Estimated capacity: ~500 chat turns/day at 5 messages per customer = ~100 customer sessions/day on Groq free tier (14,400 API calls/day).`,
  },
  {
    title: "6. Model Selection",
    content: `Two models are configured:

Groq (Primary): Llama 3.3 70B Versatile
• Free tier: 14,400 API calls/day, 6,000 tokens/min
• Fastest response time (~1-2s)
• Best for production use

OpenRouter (Fallback): Llama 3.3 70B Instruct
• Pay-per-token, no rate limits
• Automatically used when Groq is unavailable or hits rate limits
• Same model, consistent responses

Switch primary model in Settings if needed.`,
  },
];

export function HubHelp() {
  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
        Help & Documentation
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Everything you need to know about configuring and running the AI Waiter.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sections.map(s => (
          <div key={s.title} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#374151", margin: 0 }}>{s.title}</h3>
            </div>
            <pre style={{ margin: 0, padding: "1rem 1.25rem", fontSize: "0.8125rem", color: "#475569", lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {s.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
