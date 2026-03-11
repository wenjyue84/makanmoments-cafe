import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { targetType, targetCategories = [], targetItemIds = [], excludeItemIds = [] } = body;

  let count = 0;

  if (targetType === "category" && targetCategories.length > 0) {
    if (excludeItemIds.length > 0) {
      const rows = await sql<{ count: number }>`
        SELECT COUNT(DISTINCT mi.id)::int AS count
        FROM menu_items mi
        JOIN item_display_categories idc ON mi.id = idc.item_id
        JOIN display_categories dc ON idc.display_category_id = dc.id
        WHERE dc.name = ANY(${targetCategories}::text[])
          AND NOT (mi.id = ANY(${excludeItemIds}::uuid[]))
      `;
      count = rows[0]?.count ?? 0;
    } else {
      const rows = await sql<{ count: number }>`
        SELECT COUNT(DISTINCT mi.id)::int AS count
        FROM menu_items mi
        JOIN item_display_categories idc ON mi.id = idc.item_id
        JOIN display_categories dc ON idc.display_category_id = dc.id
        WHERE dc.name = ANY(${targetCategories}::text[])
      `;
      count = rows[0]?.count ?? 0;
    }
  } else if (targetType === "items" && targetItemIds.length > 0) {
    const rows = await sql<{ count: number }>`
      SELECT COUNT(*)::int AS count FROM menu_items
      WHERE id = ANY(${targetItemIds}::uuid[])
    `;
    count = rows[0]?.count ?? 0;
  }

  return NextResponse.json({ count });
}
