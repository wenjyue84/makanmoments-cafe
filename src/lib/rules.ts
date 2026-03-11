import sql from "./db";
import type { MenuItem } from "@/types/menu";
import type { Rule, MenuItemWithRules, AppliedRule } from "@/types/menu";

// ── Row mapping ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRule(row: any): Rule {
  return {
    id: row.id,
    name: row.name,
    ruleType: row.rule_type,
    targetType: row.target_type,
    targetCategories: row.target_categories ?? [],
    targetItemIds: row.target_item_ids ?? [],
    excludeItemIds: row.exclude_item_ids ?? [],
    value: Number(row.value),
    active: row.active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeFrom: row.time_from ?? "",
    timeUntil: row.time_until ?? "",
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── CRUD queries ────────────────────────────────────────────────────────────

export async function getAllRules(): Promise<Rule[]> {
  const rows = await sql`SELECT * FROM rules ORDER BY priority DESC, created_at DESC`;
  return rows.map(rowToRule);
}

export async function getActiveRules(): Promise<Rule[]> {
  const now = new Date().toISOString();
  const rows = await sql`
    SELECT * FROM rules
    WHERE active = true
      AND (starts_at IS NULL OR starts_at <= ${now}::timestamptz)
      AND (ends_at   IS NULL OR ends_at   >  ${now}::timestamptz)
    ORDER BY priority DESC
  `;
  const rules = rows.map(rowToRule);

  // Filter by daily time window (Malaysia timezone)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const nowMins = parseInt(parts.hour) * 60 + parseInt(parts.minute);

  return rules.filter((rule: Rule) => {
    if (!rule.timeFrom && !rule.timeUntil) return true;
    const [fh, fm] = (rule.timeFrom || "00:00").split(":").map(Number);
    const [uh, um] = (rule.timeUntil || "23:59").split(":").map(Number);
    return nowMins >= fh * 60 + fm && nowMins < uh * 60 + um;
  });
}

// ── Rule evaluation engine ──────────────────────────────────────────────────

function doesRuleTarget(rule: Rule, item: MenuItem): boolean {
  if (rule.excludeItemIds.includes(item.id)) return false;
  if (rule.targetType === "category") {
    return rule.targetCategories.some((cat) => item.displayCategories.includes(cat));
  }
  return rule.targetItemIds.includes(item.id);
}

/**
 * Apply active rules to menu items.
 * Precedence: disable > discount > featured.
 * Higher priority wins for same type. First discount wins per item (no stacking).
 */
export function applyRules(items: MenuItem[], rules: Rule[]): MenuItemWithRules[] {
  // Init effects per item
  const effects = new Map<
    string,
    { disabled: boolean; discountPercent: number; featured: boolean; applied: AppliedRule[] }
  >();
  for (const item of items) {
    effects.set(item.id, { disabled: false, discountPercent: 0, featured: false, applied: [] });
  }

  // Rules are already sorted by priority DESC from the query.
  // Apply each rule to matching items.
  for (const rule of rules) {
    for (const item of items) {
      if (!doesRuleTarget(rule, item)) continue;
      const eff = effects.get(item.id)!;

      const entry: AppliedRule = {
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        ...(rule.ruleType === "discount" ? { value: rule.value } : {}),
      };

      switch (rule.ruleType) {
        case "disable":
          eff.disabled = true;
          eff.applied.push(entry);
          break;
        case "discount":
          // First discount wins (highest priority already first)
          if (eff.discountPercent === 0 && rule.value > 0) {
            eff.discountPercent = rule.value;
            eff.applied.push(entry);
          }
          break;
        case "featured":
          eff.featured = true;
          eff.applied.push(entry);
          break;
      }
    }
  }

  // Build output
  return items.map((item) => {
    const eff = effects.get(item.id)!;
    const result: MenuItemWithRules = { ...item };

    if (eff.disabled) {
      result.disabledByRule = true;
    }
    if (eff.discountPercent > 0) {
      result.originalPrice = item.price;
      result.discountPercent = eff.discountPercent;
      result.price = Math.round(item.price * (1 - eff.discountPercent / 100) * 100) / 100;
    }
    if (eff.featured) {
      result.featured = true;
      result.featuredByRule = true;
    }
    if (eff.applied.length > 0) {
      result.appliedRules = eff.applied;
    }

    return result;
  });
}
