import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { targetType, targetCategories = [], targetItemIds = [], excludeItemIds = [] } = body;

  let count = 0;

  if (targetType === "category" && targetCategories.length > 0) {
    if (excludeItemIds.length > 0) {
      const rows = await sql`
        SELECT COUNT(*)::int AS count FROM menu_items
        WHERE categories && ${targetCategories}::text[]
          AND NOT (id = ANY(${excludeItemIds}::uuid[]))
      `;
      count = rows[0]?.count ?? 0;
    } else {
      const rows = await sql`
        SELECT COUNT(*)::int AS count FROM menu_items
        WHERE categories && ${targetCategories}::text[]
      `;
      count = rows[0]?.count ?? 0;
    }
  } else if (targetType === "items" && targetItemIds.length > 0) {
    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM menu_items
      WHERE id = ANY(${targetItemIds}::uuid[])
    `;
    count = rows[0]?.count ?? 0;
  }

  return NextResponse.json({ count });
}
