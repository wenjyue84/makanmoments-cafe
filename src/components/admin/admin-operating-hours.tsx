"use client";

import { useState, useEffect } from "react";

interface OperatingHoursConfig {
  openHour: number;
  openMinute: number;
  lastOrderHour: number;
  lastOrderMinute: number;
  closeHour: number;
  closeMinute: number;
}

function toTimeString(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

export function AdminOperatingHours() {
  const [config, setConfig] = useState<OperatingHoursConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/operating-hours")
      .then((r) => r.json())
      .then((data: OperatingHoursConfig) => setConfig(data))
      .catch(() => setError("Failed to load operating hours config"));
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/operating-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        {error ?? "Loading…"}
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-gray-700">Operating Hours</h3>
        <p className="mb-4 text-xs text-gray-500">
          All times are Malaysia time (UTC+8). Non-admin users will see a banner when the cafe is closed.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-sm text-gray-700">Open time</label>
          <input
            type="time"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            value={toTimeString(config.openHour, config.openMinute)}
            onChange={(e) => {
              const { hour, minute } = parseTime(e.target.value);
              setConfig({ ...config, openHour: hour, openMinute: minute });
            }}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-sm text-gray-700">Last order</label>
          <input
            type="time"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            value={toTimeString(config.lastOrderHour, config.lastOrderMinute)}
            onChange={(e) => {
              const { hour, minute } = parseTime(e.target.value);
              setConfig({ ...config, lastOrderHour: hour, lastOrderMinute: minute });
            }}
          />
          <span className="text-xs text-gray-500">After this: &quot;Last order passed&quot; banner</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-sm text-gray-700">Close time</label>
          <input
            type="time"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            value={toTimeString(config.closeHour, config.closeMinute)}
            onChange={(e) => {
              const { hour, minute } = parseTime(e.target.value);
              setConfig({ ...config, closeHour: hour, closeMinute: minute });
            }}
          />
          <span className="text-xs text-gray-500">After this: &quot;Closed&quot; banner</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
