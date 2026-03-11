"use client";

import { useState } from "react";

type TestStatus = "idle" | "running" | "pass" | "fail";

interface TestCase {
  id: string;
  question: string;
  mustContain: string[];
  description: string;
}

interface TestResult {
  status: TestStatus;
  response: string;
  expanded: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: "halal",
    question: "Is the food halal?",
    mustContain: ["halal", "pork", "lard"],
    description: "AI should mention halal status and no pork/lard policy",
  },
  {
    id: "hours",
    question: "What time do you open?",
    mustContain: ["open", "am", "morning", "9", "10", "hour"],
    description: "AI should give opening hours",
  },
  {
    id: "under15",
    question: "Recommend something under RM15",
    mustContain: ["rm", "15", "rm1", "rm8", "rm9", "rm10", "rm11", "rm12", "rm13", "rm14"],
    description: "AI should recommend items with prices under RM15",
  },
  {
    id: "noodles",
    question: "What noodle dishes do you have?",
    mustContain: ["noodle", "laksa", "pad thai", "mee", "pasta", "rice noodle", "kway"],
    description: "AI should list noodle/pasta dishes from the menu",
  },
  {
    id: "wifi",
    question: "What's the WiFi password?",
    mustContain: ["wifi", "wi-fi", "password", "internet", "wireless", "network"],
    description: "AI should provide or acknowledge WiFi info",
  },
];

async function runSingleTest(question: string): Promise<string> {
  const msgId = Date.now().toString(36);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { id: msgId, role: "user", parts: [{ type: "text", text: question }] },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      if (!part.trim()) continue;
      const dataLine = part.split("\n").find(l => l.startsWith("data: "));
      if (!dataLine) continue;
      const raw = dataLine.slice(6);
      if (raw === "[DONE]") return fullText;
      try {
        const ev = JSON.parse(raw);
        if (ev.type === "text-delta") fullText += ev.textDelta;
        else if (ev.type === "finish" || ev.type === "error") return fullText;
      } catch { /* skip */ }
    }
  }
  return fullText;
}

export function HubAutomatedTests() {
  const [results, setResults] = useState<Record<string, TestResult>>(
    Object.fromEntries(TEST_CASES.map(t => [t.id, { status: "idle", response: "", expanded: false }]))
  );
  const [runningAll, setRunningAll] = useState(false);

  function setResult(id: string, update: Partial<TestResult>) {
    setResults(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));
  }

  async function runTest(tc: TestCase) {
    setResult(tc.id, { status: "running", response: "", expanded: false });
    try {
      const text = await runSingleTest(tc.question);
      const lower = text.toLowerCase();
      const passed = tc.mustContain.some(kw => lower.includes(kw.toLowerCase()));
      setResult(tc.id, { status: passed ? "pass" : "fail", response: text });
    } catch (err) {
      setResult(tc.id, { status: "fail", response: `Error: ${String(err)}` });
    }
  }

  async function runAll() {
    setRunningAll(true);
    for (const tc of TEST_CASES) {
      await runTest(tc);
    }
    setRunningAll(false);
  }

  const passCount = TEST_CASES.filter(t => results[t.id].status === "pass").length;
  const failCount = TEST_CASES.filter(t => results[t.id].status === "fail").length;
  const anyRan = passCount + failCount > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            Automated Tests
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
            Run preset questions against the live AI and verify responses contain expected keywords.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {anyRan && (
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: failCount > 0 ? "#dc2626" : "#16a34a" }}>
              {passCount}/{TEST_CASES.length} passed
            </span>
          )}
          <button
            onClick={runAll}
            disabled={runningAll}
            style={{
              padding: "0.5rem 1.25rem",
              background: runningAll ? "#94a3b8" : "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: runningAll ? "not-allowed" : "pointer",
            }}
          >
            {runningAll ? "Running…" : "Run All Tests"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {TEST_CASES.map(tc => {
          const r = results[tc.id];
          return (
            <div key={tc.id} style={{ background: "#fff", borderRadius: "1rem", border: `1px solid ${r.status === "pass" ? "#bbf7d0" : r.status === "fail" ? "#fecaca" : "#e5e7eb"}`, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", background: r.status === "pass" ? "#f0fdf4" : r.status === "fail" ? "#fef2f2" : "#f8fafc" }}>
                {/* Status badge */}
                <StatusBadge status={r.status} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>{tc.question}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.125rem" }}>{tc.description}</div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {r.response && (
                    <button
                      onClick={() => setResult(tc.id, { expanded: !r.expanded })}
                      style={{ padding: "0.3rem 0.625rem", background: "none", border: "1px solid #e2e8f0", borderRadius: "0.375rem", fontSize: "0.75rem", color: "#64748b", cursor: "pointer" }}
                    >
                      {r.expanded ? "Hide" : "Show"} response
                    </button>
                  )}
                  <button
                    onClick={() => runTest(tc)}
                    disabled={r.status === "running" || runningAll}
                    style={{
                      padding: "0.3rem 0.75rem",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.375rem",
                      fontSize: "0.75rem",
                      color: "#374151",
                      cursor: r.status === "running" || runningAll ? "not-allowed" : "pointer",
                      opacity: r.status === "running" ? 0.6 : 1,
                    }}
                  >
                    {r.status === "running" ? "…" : "Run"}
                  </button>
                </div>
              </div>

              {/* Response accordion */}
              {r.expanded && r.response && (
                <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    AI Response
                  </div>
                  <pre style={{ margin: 0, fontSize: "0.8125rem", color: "#475569", lineHeight: 1.65, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                    {r.response}
                  </pre>
                  <div style={{ marginTop: "0.625rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                    Expected to contain (any): {tc.mustContain.map(k => `"${k}"`).join(", ")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TestStatus }) {
  const config = {
    idle: { bg: "#f1f5f9", color: "#94a3b8", label: "IDLE" },
    running: { bg: "#fef3c7", color: "#d97706", label: "RUN" },
    pass: { bg: "#dcfce7", color: "#16a34a", label: "PASS ✓" },
    fail: { bg: "#fee2e2", color: "#dc2626", label: "FAIL ✗" },
  }[status];

  return (
    <span style={{
      padding: "0.2rem 0.5rem",
      borderRadius: "0.375rem",
      background: config.bg,
      color: config.color,
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      flexShrink: 0,
    }}>
      {config.label}
    </span>
  );
}
