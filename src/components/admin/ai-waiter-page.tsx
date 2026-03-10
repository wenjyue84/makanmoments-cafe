"use client";

import { useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";

type Status = "checking" | "online" | "offline";

export function AiWaiterPage() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/ai-waiter/health");
        const data = await res.json();
        if (!cancelled) setStatus(data.online ? "online" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>Connecting to Rainbow AI...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-gray-400" />
          <span className="text-lg font-semibold text-gray-700">Rainbow AI</span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            Offline
          </span>
        </div>
        <p className="text-sm text-gray-500">The Rainbow AI service is not running.</p>
        <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-mono text-gray-700">
          cd rainbow-ai &amp;&amp; npm run dev
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Auto-retrying every 5s...</span>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src="http://localhost:3002/"
      className="w-full border-0 rounded-lg"
      style={{ height: "calc(100vh - 8rem)" }}
      title="Rainbow AI Dashboard"
    />
  );
}
