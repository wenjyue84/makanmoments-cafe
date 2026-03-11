"use client";

import { useState } from "react";
import type { RuleType, TargetType } from "@/types/menu";
import { cn } from "@/lib/utils";

interface SuggestedRule {
  name: string;
  ruleType: RuleType;
  targetType: TargetType;
  targetCategories: string[];
  value: number;
  timeFrom: string;
  timeUntil: string;
  active: boolean;
}

interface AdminRulesAiHelperProps {
  displayCategories: string[];
  onApply: (suggestion: SuggestedRule) => void;
}

const TEMPLATE_PROMPTS = [
  { label: "Hide after 3PM", prompt: "Hide all rice dishes after 3:00 PM every day" },
  { label: "Breakfast hours", prompt: "Make all breakfast items available only between 7:00 AM and 11:00 AM" },
  { label: "Weekday lunch", prompt: "Show lunch set items only on weekdays from 11:00 AM to 2:30 PM" },
  { label: "Weekend specials", prompt: "Enable Chef's Picks items only on Saturday and Sunday" },
  { label: "Monday closed", prompt: "Disable all menu items every Monday (cafe is closed)" },
  { label: "Drink promo", prompt: "Apply a discount label to all drinks on Friday evenings after 5:00 PM" },
  { label: "Dinner only", prompt: "Show dinner set items only after 6:00 PM daily" },
];

export function AdminRulesAiHelper({ displayCategories, onApply }: AdminRulesAiHelperProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestedRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch("/api/admin/rules/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, categories: displayCategories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate suggestion");
      setSuggestion(data.suggestion);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function applyAndClose() {
    if (!suggestion) return;
    onApply(suggestion);
    setSuggestion(null);
    setDescription("");
    setOpen(false);
  }

  const RULE_TYPE_COLORS: Record<RuleType, string> = {
    disable: "bg-red-100 text-red-700",
    discount: "bg-green-100 text-green-700",
    featured: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/50">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-orange-700"
      >
        <span className="flex items-center gap-2">
          <span>✨</span>
          <span>AI Rule Helper</span>
        </span>
        <span className="text-xs text-orange-500">{open ? "▲ Hide" : "▼ Expand"}</span>
      </button>

      {open && (
        <div className="border-t border-orange-200 px-4 py-4 space-y-3">
          <p className="text-xs text-orange-600">
            Describe the rule in plain language and let AI pre-fill the form for you.
          </p>

          {/* Template chips */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Try a template:</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_PROMPTS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setDescription(t.prompt)}
                  className="text-xs px-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate();
              }}
              placeholder='e.g. "Give 10% discount on all rice dishes at lunch time"'
              className="min-h-[72px] flex-1 rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
              disabled={loading}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !description.trim()}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
              loading || !description.trim()
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            )}
          >
            {loading ? "Generating..." : "Generate Rule"}
          </button>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* Suggestion preview */}
          {suggestion && (
            <div className="rounded-lg border bg-white p-4 space-y-2 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                AI Suggestion
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    RULE_TYPE_COLORS[suggestion.ruleType]
                  )}
                >
                  {suggestion.ruleType}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {suggestion.targetType}
                </span>
              </div>

              <p className="font-medium text-gray-800">{suggestion.name}</p>

              {suggestion.targetCategories.length > 0 && (
                <p className="text-sm text-gray-500">
                  Categories: {suggestion.targetCategories.join(", ")}
                </p>
              )}

              {suggestion.ruleType === "discount" && suggestion.value > 0 && (
                <p className="text-sm text-gray-500">{suggestion.value}% off</p>
              )}

              {(suggestion.timeFrom || suggestion.timeUntil) && (
                <p className="text-sm text-gray-500">
                  Daily window: {suggestion.timeFrom || "00:00"} – {suggestion.timeUntil || "23:59"}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={applyAndClose}
                  className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
                >
                  Apply to Form
                </button>
                <button
                  onClick={() => setSuggestion(null)}
                  className="rounded-md border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
