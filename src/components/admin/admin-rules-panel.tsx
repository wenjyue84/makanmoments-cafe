"use client";

import { useState, useEffect, useCallback } from "react";
import type { Rule, RuleType, TargetType } from "@/types/menu";
import { cn } from "@/lib/utils";

interface AdminRulesPanelProps {
  categories: string[];
}

interface RuleRow {
  id: string;
  name: string;
  rule_type: RuleType;
  target_type: TargetType;
  target_categories: string[];
  target_item_ids: string[];
  exclude_item_ids: string[];
  value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  time_from: string;
  time_until: string;
  priority: number;
}

interface MenuItemOption {
  id: string;
  name_en: string;
  code: string;
  categories: string[];
}

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  disable: "Disable",
  discount: "Discount",
  featured: "Featured",
};

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  disable: "bg-red-100 text-red-700",
  discount: "bg-green-100 text-green-700",
  featured: "bg-amber-100 text-amber-700",
};

const EMPTY_FORM = {
  name: "",
  ruleType: "disable" as RuleType,
  targetType: "category" as TargetType,
  targetCategories: [] as string[],
  targetItemIds: [] as string[],
  excludeItemIds: [] as string[],
  value: 0,
  active: true,
  startsAt: "",
  endsAt: "",
  timeFrom: "",
  timeUntil: "",
  priority: 0,
};

export function AdminRulesPanel({ categories }: AdminRulesPanelProps) {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState<number | null>(null);

  // Menu items for item-level targeting and exclusions
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [showExclusions, setShowExclusions] = useState(false);

  // ── Fetch rules ─────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      setRules(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ── Fetch menu items (lazy, for item targeting or category exclusions) ──

  useEffect(() => {
    if (menuItems.length === 0 && (form.targetType === "items" || (form.targetType === "category" && showExclusions))) {
      fetch("/api/admin/menu")
        .then((r) => r.json())
        .then(setMenuItems)
        .catch(() => {});
    }
  }, [form.targetType, menuItems.length, showExclusions]);

  // ── Preview count ───────────────────────────────────────────────────────

  useEffect(() => {
    const hasTarget =
      (form.targetType === "category" && form.targetCategories.length > 0) ||
      (form.targetType === "items" && form.targetItemIds.length > 0);

    if (!hasTarget) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/rules/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: form.targetType,
            targetCategories: form.targetCategories,
            targetItemIds: form.targetItemIds,
            excludeItemIds: form.excludeItemIds,
          }),
        });
        const data = await res.json();
        setPreview(data.count);
      } catch {
        setPreview(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.targetType, form.targetCategories, form.targetItemIds, form.excludeItemIds]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setShowExclusions(false);
    setPreview(null);
    setItemSearch("");
    setExcludeSearch("");
  }

  function openEdit(rule: RuleRow) {
    const hasExclusions = (rule.exclude_item_ids?.length ?? 0) > 0;
    setForm({
      name: rule.name,
      ruleType: rule.rule_type,
      targetType: rule.target_type,
      targetCategories: rule.target_categories,
      targetItemIds: rule.target_item_ids,
      excludeItemIds: rule.exclude_item_ids ?? [],
      value: rule.value,
      active: rule.active,
      startsAt: rule.starts_at ? rule.starts_at.slice(0, 16) : "",
      endsAt: rule.ends_at ? rule.ends_at.slice(0, 16) : "",
      timeFrom: rule.time_from ?? "",
      timeUntil: rule.time_until ?? "",
      priority: rule.priority,
    });
    setEditingId(rule.id);
    setShowForm(true);
    setShowExclusions(hasExclusions);
    setItemSearch("");
    setExcludeSearch("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setPreview(null);
  }

  async function saveRule() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        ruleType: form.ruleType,
        targetType: form.targetType,
        targetCategories: form.targetCategories,
        targetItemIds: form.targetItemIds,
        excludeItemIds: form.excludeItemIds,
        value: form.ruleType === "discount" ? form.value : 0,
        active: form.active,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        timeFrom: form.timeFrom || "",
        timeUntil: form.timeUntil || "",
        priority: form.priority,
      };

      const url = editingId ? `/api/admin/rules/${editingId}` : "/api/admin/rules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save rule");
      }

      await fetchRules();
      cancelForm();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    try {
      await fetch(`/api/admin/rules/${id}`, { method: "DELETE" });
      await fetchRules();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleActive(rule: RuleRow) {
    try {
      await fetch(`/api/admin/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !rule.active }),
      });
      await fetchRules();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      targetCategories: f.targetCategories.includes(cat)
        ? f.targetCategories.filter((c) => c !== cat)
        : [...f.targetCategories, cat],
    }));
  }

  function toggleItem(id: string) {
    setForm((f) => ({
      ...f,
      targetItemIds: f.targetItemIds.includes(id)
        ? f.targetItemIds.filter((i) => i !== id)
        : [...f.targetItemIds, id],
    }));
  }

  function toggleExcludeItem(id: string) {
    setForm((f) => ({
      ...f,
      excludeItemIds: f.excludeItemIds.includes(id)
        ? f.excludeItemIds.filter((i) => i !== id)
        : [...f.excludeItemIds, id],
    }));
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) return <p className="text-sm text-gray-500">Loading rules...</p>;

  const filteredItems = menuItems.filter(
    (m) =>
      m.name_en.toLowerCase().includes(itemSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Rules ({rules.length})
        </h2>
        {!showForm && (
          <button
            onClick={openNew}
            className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            + Add Rule
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
          <h3 className="font-medium">
            {editingId ? "Edit Rule" : "New Rule"}
          </h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border px-3 py-1.5 text-sm"
              placeholder="e.g. Ramadan Drinks Discount"
            />
          </div>

          {/* Rule type + Target type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <select
                value={form.ruleType}
                onChange={(e) => setForm((f) => ({ ...f, ruleType: e.target.value as RuleType }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              >
                <option value="disable">Disable (hide items)</option>
                <option value="discount">Discount (% off)</option>
                <option value="featured">Featured (promote)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select
                value={form.targetType}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    targetType: e.target.value as TargetType,
                    targetCategories: [],
                    targetItemIds: [],
                    excludeItemIds: [],
                  }));
                  setShowExclusions(false);
                  setExcludeSearch("");
                }}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              >
                <option value="category">By Category</option>
                <option value="items">Specific Items</option>
              </select>
            </div>
          </div>

          {/* Target selector */}
          {form.targetType === "category" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        form.targetCategories.includes(cat)
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.targetCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Exclusions */}
              {form.targetCategories.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowExclusions((v) => !v)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    {showExclusions ? "Hide" : "Except..."}{" "}
                    {form.excludeItemIds.length > 0 && `(${form.excludeItemIds.length} excluded)`}
                  </button>

                  {showExclusions && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={excludeSearch}
                        onChange={(e) => setExcludeSearch(e.target.value)}
                        className="mb-2 w-full rounded-md border px-3 py-1.5 text-sm"
                        placeholder="Search items to exclude..."
                      />
                      <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                        {menuItems
                          .filter((m) =>
                            m.categories?.some((c) => form.targetCategories.includes(c))
                          )
                          .filter(
                            (m) =>
                              m.name_en.toLowerCase().includes(excludeSearch.toLowerCase()) ||
                              m.code.toLowerCase().includes(excludeSearch.toLowerCase())
                          )
                          .map((m) => (
                            <label
                              key={m.id}
                              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={form.excludeItemIds.includes(m.id)}
                                onChange={() => toggleExcludeItem(m.id)}
                                className="rounded"
                              />
                              <span className="text-gray-400 text-xs">{m.code}</span>
                              {m.name_en}
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items ({form.targetItemIds.length} selected)
              </label>
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="mb-2 w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="Search items..."
              />
              <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                {filteredItems.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.targetItemIds.includes(m.id)}
                      onChange={() => toggleItem(m.id)}
                      className="rounded"
                    />
                    <span className="text-gray-400 text-xs">{m.code}</span>
                    {m.name_en}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Discount value (only for discount type) */}
          {form.ruleType === "discount" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount %
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                className="w-32 rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
          )}

          {/* Daily time window */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily from (optional)
              </label>
              <input
                type="time"
                value={form.timeFrom}
                onChange={(e) => setForm((f) => ({ ...f, timeFrom: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily until (optional)
              </label>
              <input
                type="time"
                value={form.timeUntil}
                onChange={(e) => setForm((f) => ({ ...f, timeUntil: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Date range schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="w-full rounded-md border px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority (higher = wins)
            </label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
              className="w-32 rounded-md border px-3 py-1.5 text-sm"
            />
          </div>

          {/* Preview */}
          {preview !== null && (
            <p className="text-sm text-gray-500">
              Will affect <span className="font-semibold text-orange-600">{preview}</span> menu item{preview !== 1 ? "s" : ""}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={saveRule}
              disabled={saving || !form.name}
              className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={cancelForm}
              className="rounded-md border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <p className="text-sm text-gray-500">No rules yet. Create one to manage menu items in bulk.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-lg border bg-white p-4 shadow-sm",
                !rule.active && "opacity-60"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{rule.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        RULE_TYPE_COLORS[rule.rule_type]
                      )}
                    >
                      {RULE_TYPE_LABELS[rule.rule_type]}
                    </span>
                    {!rule.active && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500">
                    {rule.target_type === "category"
                      ? `Categories: ${rule.target_categories.join(", ") || "none"}${
                          (rule.exclude_item_ids?.length ?? 0) > 0
                            ? ` (except ${rule.exclude_item_ids.length} item${rule.exclude_item_ids.length !== 1 ? "s" : ""})`
                            : ""
                        }`
                      : `${rule.target_item_ids.length} item${rule.target_item_ids.length !== 1 ? "s" : ""}`}
                    {rule.rule_type === "discount" && ` · ${rule.value}% off`}
                    {rule.priority > 0 && ` · Priority ${rule.priority}`}
                  </p>

                  {(rule.time_from || rule.time_until) && (
                    <p className="text-xs text-gray-400">
                      Daily {rule.time_from || "00:00"} – {rule.time_until || "23:59"}
                    </p>
                  )}
                  {(rule.starts_at || rule.ends_at) && (
                    <p className="text-xs text-gray-400">
                      {rule.starts_at && `From ${new Date(rule.starts_at).toLocaleString()}`}
                      {rule.starts_at && rule.ends_at && " "}
                      {rule.ends_at && `Until ${new Date(rule.ends_at).toLocaleString()}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap">
                  <button
                    onClick={() => toggleActive(rule)}
                    className={cn(
                      "min-h-[44px] rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      rule.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    {rule.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => openEdit(rule)}
                    className="min-h-[44px] rounded-md border px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="min-h-[44px] rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
