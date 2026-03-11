"use client";

import { useState } from "react";
import type { RuleType, TargetType } from "@/types/menu";

export interface RuleRow {
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

export interface AiRuleSuggestion {
  name: string;
  ruleType: RuleType;
  targetType: TargetType;
  targetCategories: string[];
  value: number;
  timeFrom: string;
  timeUntil: string;
  active: boolean;
}

export const EMPTY_RULE_FORM = {
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

export type RuleFormState = typeof EMPTY_RULE_FORM;

export function useRuleForm() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [preview, setPreview] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [showExclusions, setShowExclusions] = useState(false);

  function resetForm() {
    setForm(EMPTY_RULE_FORM);
    setItemSearch("");
    setExcludeSearch("");
    setShowExclusions(false);
    setPreview(null);
  }

  function openNew() {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(rule: RuleRow) {
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
    setShowExclusions((rule.exclude_item_ids?.length ?? 0) > 0);
    setItemSearch("");
    setExcludeSearch("");
  }

  function applyAiSuggestion(s: AiRuleSuggestion) {
    setForm({
      ...EMPTY_RULE_FORM,
      name: s.name,
      ruleType: s.ruleType,
      targetType: s.targetType,
      targetCategories: s.targetCategories,
      value: s.value,
      timeFrom: s.timeFrom,
      timeUntil: s.timeUntil,
      active: s.active,
    });
    setEditingId(null);
    setShowForm(true);
    setShowExclusions(false);
    setItemSearch("");
    setExcludeSearch("");
    setPreview(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setPreview(null);
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

  return {
    showForm,
    editingId,
    form,
    setForm,
    preview,
    setPreview,
    itemSearch,
    setItemSearch,
    excludeSearch,
    setExcludeSearch,
    showExclusions,
    setShowExclusions,
    openNew,
    openEdit,
    applyAiSuggestion,
    cancelForm,
    toggleCategory,
    toggleItem,
    toggleExcludeItem,
  };
}
