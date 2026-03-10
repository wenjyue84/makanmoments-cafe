"use client";

import { useState, useEffect } from "react";
import type { ChatSettings } from "@/lib/chat/settings";

interface ChatSettingsPanelProps {
  initialSettings: ChatSettings;
}

export function ChatSettingsPanel({ initialSettings }: ChatSettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  // Sync if server re-renders with new data
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/chat-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="space-y-8">
      {/* System Prompt Prefix */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          System Prompt Prefix
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Prepended before the default AI waiter instructions. Leave blank to
          use the default prompt only.
        </p>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-3 text-sm font-mono text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          rows={6}
          placeholder="e.g. Today's special is Mango Sticky Rice (RM 8.90). Mention it if the customer asks for dessert."
          value={settings.systemPromptPrefix}
          onChange={(e) =>
            setSettings((s) => ({ ...s, systemPromptPrefix: e.target.value }))
          }
        />
      </section>

      {/* Model Selection */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          AI Model
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Choose the AI provider for chat responses. Groq is the primary (faster,
          free tier). OpenRouter is the fallback.
        </p>
        <div className="flex gap-4">
          {(["groq", "openrouter"] as const).map((m) => (
            <label
              key={m}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50"
            >
              <input
                type="radio"
                name="model"
                value={m}
                checked={settings.model === m}
                onChange={() => setSettings((s) => ({ ...s, model: m }))}
                className="accent-orange-500"
              />
              <span className="text-sm font-medium capitalize text-gray-700">
                {m === "groq" ? "Groq (Llama 3.3 70B)" : "OpenRouter (Llama 3.3 70B)"}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Temperature Slider */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Temperature
          <span className="ml-2 text-orange-600">{settings.temperature.toFixed(1)}</span>
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Controls response creativity. Lower = more focused and consistent.
          Higher = more varied and creative. Recommended: 0.5–0.8.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">0.0 (precise)</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                temperature: parseFloat(e.target.value),
              }))
            }
            className="flex-1 accent-orange-500"
          />
          <span className="text-xs text-gray-400">2.0 (creative)</span>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {status === "saved" && (
          <span className="text-sm font-medium text-green-600">
            Settings saved — AI will use updated config on next message.
          </span>
        )}
        {status === "error" && (
          <span className="text-sm font-medium text-red-600">
            Failed to save. Check server logs.
          </span>
        )}
      </div>
    </div>
  );
}
