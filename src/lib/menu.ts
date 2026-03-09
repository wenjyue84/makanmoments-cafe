import sql from "./db";
import { filterByAvailability } from "./availability";
import type { MenuItem, MenuItemWithRules } from "@/types/menu";
import { getActiveRules, applyRules } from "./rules";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    code: row.code,
    nameEn: row.name_en,
    nameMs: row.name_ms,
    nameZh: row.name_zh,
    price: Number(row.price),
    description: row.description ?? "",
    dietary: row.dietary ?? [],
    categories: row.categories ?? [],
    available: row.available,
    featured: row.featured,
    photo: `/images/menu/${row.code}.jpg`,
    sortOrder: row.sort_order ?? 0,
    availableDays: row.available_days ?? [],
    timeFrom: row.time_from ?? "",
    timeUntil: row.time_until ?? "",
    specialDates: row.special_dates ?? [],
  };
}

// Public menu — available items filtered by Malaysia time, with rules applied
export async function getMenuItems(): Promise<MenuItemWithRules[]> {
  const [rows, rules] = await Promise.all([
    sql`SELECT * FROM menu_items WHERE available = true ORDER BY sort_order ASC, name_en ASC`,
    getActiveRules(),
  ]);
  const items = rows.map(rowToMenuItem);
  const withRules = applyRules(items, rules);
  return filterByAvailability(withRules.filter((i) => !i.disabledByRule));
}

// Homepage — featured items, padded to MIN_HIGHLIGHTS with top-sorted items if needed
const MIN_HIGHLIGHTS = 6;

export async function getFeaturedItems(): Promise<MenuItemWithRules[]> {
  const [rows, rules] = await Promise.all([
    sql`SELECT * FROM menu_items WHERE available = true ORDER BY sort_order ASC`,
    getActiveRules(),
  ]);
  const items = rows.map(rowToMenuItem);
  const withRules = applyRules(items, rules);
  const available = filterByAvailability(withRules.filter((i) => !i.disabledByRule));

  const featured = available.filter((i) => i.featured).slice(0, 8);
  if (featured.length >= MIN_HIGHLIGHTS) return featured;

  // Pad with top-sorted non-featured items to always reach MIN_HIGHLIGHTS
  const featuredIds = new Set(featured.map((i) => i.id));
  const padding = available
    .filter((i) => !featuredIds.has(i.id))
    .slice(0, MIN_HIGHLIGHTS - featured.length);

  return [...featured, ...padding];
}

// Admin — all items, no availability filter
export async function getAllMenuItemsForAdmin(): Promise<MenuItem[]> {
  const rows = await sql`SELECT * FROM menu_items ORDER BY sort_order ASC, name_en ASC`;
  return rows.map(rowToMenuItem);
}

// Admin — all items with rule effects computed (for admin visibility)
export async function getAllMenuItemsWithRulesForAdmin(): Promise<MenuItemWithRules[]> {
  const [rows, rules] = await Promise.all([
    sql`SELECT * FROM menu_items ORDER BY sort_order ASC, name_en ASC`,
    getActiveRules(),
  ]);
  return applyRules(rows.map(rowToMenuItem), rules);
}

// Category list for filter bar and admin
export async function getCategories(): Promise<string[]> {
  const rows = await sql`SELECT name FROM categories ORDER BY sort_order ASC`;
  return rows.map((r: Record<string, unknown>) => r.name as string);
}
