import sql from "./db";
import { filterByAvailability } from "./availability";
import type { MenuItem } from "@/types/menu";

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

// Public menu — available items filtered by Malaysia time
export async function getMenuItems(): Promise<MenuItem[]> {
  const rows = await sql`
    SELECT * FROM menu_items WHERE available = true
    ORDER BY sort_order ASC, name_en ASC
  `;
  return filterByAvailability(rows.map(rowToMenuItem));
}

// Homepage — featured items (max 8)
export async function getFeaturedItems(): Promise<MenuItem[]> {
  const rows = await sql`
    SELECT * FROM menu_items WHERE available = true AND featured = true
    ORDER BY sort_order ASC LIMIT 8
  `;
  return filterByAvailability(rows.map(rowToMenuItem));
}

// Admin — all items, no availability filter
export async function getAllMenuItemsForAdmin(): Promise<MenuItem[]> {
  const rows = await sql`SELECT * FROM menu_items ORDER BY sort_order ASC, name_en ASC`;
  return rows.map(rowToMenuItem);
}

// Category list for filter bar and admin
export async function getCategories(): Promise<string[]> {
  const rows = await sql`SELECT name FROM categories ORDER BY sort_order ASC`;
  return rows.map((r: Record<string, unknown>) => r.name as string);
}
