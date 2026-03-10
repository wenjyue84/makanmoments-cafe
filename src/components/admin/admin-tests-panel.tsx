"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TestMeta, TestCategory, StreamEvent } from "@/lib/tests";

type TestStatus = "pending" | "running" | "pass" | "fail";

interface TestState {
  status: TestStatus;
  log: string;
  duration: number;
}

const CATEGORY_LABELS: Record<TestCategory, string> = {
  smoke: "Smoke Tests",
  unit: "Unit Tests",
  integration: "Integration Tests",
  e2e: "E2E Tests",
  "new-features": "New Features",
  "pre-order": "Pre-Order System",
};

const CATEGORY_ORDER: TestCategory[] = ["smoke", "unit", "integration", "e2e", "new-features", "pre-order"];

function StatusBadge({ status }: { status: TestStatus }) {
  const styles: Record<TestStatus, string> = {
    pending: "bg-gray-100 text-gray-500",
    running: "bg-blue-100 text-blue-700 animate-pulse",
    pass: "bg-green-100 text-green-700",
    fail: "bg-red-100 text-red-700",
  };
  const labels: Record<TestStatus, string> = {
    pending: "pending",
    running: "running",
    pass: "pass",
    fail: "fail",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function AdminTestsPanel() {
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [states, setStates] = useState<Record<string, TestState>>({});
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number; duration: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/tests");
      if (!res.ok) throw new Error(`Failed to load tests (${res.status})`);
      const data = (await res.json()) as TestMeta[];
      setTests(data);
      const initial: Record<string, TestState> = {};
      data.forEach((t) => {
        initial[t.id] = { status: "pending", log: "", duration: 0 };
      });
      setStates(initial);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const runTests = useCallback(async (ids?: string[]) => {
    if (running) return;
    setRunning(true);
    setSummary(null);
    setGenerateMsg(null);

    // Reset states for tests being run
    const resetIds = ids ?? tests.map((t) => t.id);
    setStates((prev) => {
      const next = { ...prev };
      resetIds.forEach((id) => {
        next[id] = { status: "pending", log: "", duration: 0 };
      });
      return next;
    });

    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: resetIds }),
    });

    if (!res.body) {
      setRunning(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed) as StreamEvent;
          if (event.type === "start") {
            setStates((prev) => ({
              ...prev,
              [event.id]: { status: "running", log: "Running...", duration: 0 },
            }));
          } else if (event.type === "result") {
            setStates((prev) => ({
              ...prev,
              [event.id]: {
                status: event.pass ? "pass" : "fail",
                log: event.log,
                duration: event.duration,
              },
            }));
          } else if (event.type === "done") {
            setSummary({
              total: event.total,
              passed: event.passed,
              failed: event.failed,
              duration: event.duration,
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    setRunning(false);
  }, [running, tests]);

  const generateStories = useCallback(async () => {
    setGenerating(true);
    setGenerateMsg(null);

    const failedTests = tests
      .filter((t) => states[t.id]?.status === "fail")
      .map((t) => ({
        id: t.id,
        name: t.name,
        log: states[t.id]?.log ?? "",
      }));

    if (failedTests.length === 0) {
      setGenerateMsg("No failing tests to generate stories for.");
      setGenerating(false);
      return;
    }

    const res = await fetch("/api/admin/tests/generate-stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ failedTests }),
    });

    const data = await res.json() as { ok?: boolean; added?: number; message?: string; error?: string };
    if (data.ok) {
      setGenerateMsg(
        data.added === 0
          ? data.message ?? "Stories already exist for all failing tests."
          : `Generated ${data.added} new user ${data.added === 1 ? "story" : "stories"} in prd.json.`
      );
    } else {
      setGenerateMsg(`Error: ${data.error ?? "Unknown error"}`);
    }
    setGenerating(false);
  }, [tests, states]);

  const groupedTests = CATEGORY_ORDER.reduce<Record<TestCategory, TestMeta[]>>(
    (acc, cat) => {
      acc[cat] = tests.filter((t) => t.category === cat);
      return acc;
    },
    { smoke: [], unit: [], integration: [], e2e: [], "new-features": [], "pre-order": [] }
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
        <p className="text-gray-500 text-sm">Loading tests...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600 text-sm">{loadError}</p>
        <button
          onClick={loadTests}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const failCount = tests.filter((t) => states[t.id]?.status === "fail").length;

  return (
    <div className="space-y-6">
      {/* Header / Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => runTests()}
          disabled={running}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
            running
              ? "cursor-not-allowed bg-gray-400"
              : "bg-orange-500 hover:bg-orange-600"
          )}
        >
          {running ? "Running..." : "Run All"}
        </button>

        {failCount > 0 && !running && (
          <button
            onClick={generateStories}
            disabled={generating}
            className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {generating ? "Generating..." : `Generate Stories (${failCount} failing)`}
          </button>
        )}

        {generateMsg && (
          <span className="text-sm text-gray-600 italic">{generateMsg}</span>
        )}
      </div>

      {/* Summary bar */}
      {summary && (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          summary.failed === 0
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        )}>
          <span className="font-medium">
            {summary.failed === 0 ? "All tests passed" : `${summary.failed} test${summary.failed !== 1 ? "s" : ""} failed`}
          </span>
          {" — "}
          {summary.passed}/{summary.total} passed in {(summary.duration / 1000).toFixed(1)}s
        </div>
      )}

      {/* Test groups */}
      {CATEGORY_ORDER.map((category) => {
        const categoryTests = groupedTests[category];
        if (categoryTests.length === 0) return null;
        return (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="divide-y rounded-lg border bg-white">
              {categoryTests.map((test) => {
                const state = states[test.id] ?? { status: "pending" as TestStatus, log: "", duration: 0 };
                return (
                  <div key={test.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{test.name}</span>
                          <StatusBadge status={state.status} />
                          {state.duration > 0 && (
                            <span className="text-xs text-gray-400">{state.duration}ms</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{test.description}</p>
                        {state.log && (
                          <pre className={cn(
                            "mt-2 rounded p-2 text-xs font-mono whitespace-pre-wrap break-all",
                            state.status === "pass" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                          )}>
                            {state.log}
                          </pre>
                        )}
                      </div>
                      <button
                        onClick={() => runTests([test.id])}
                        disabled={running}
                        className="min-h-[44px] shrink-0 rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
