import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// Protected by middleware — only reachable with a valid admin session.
export async function GET() {
  try {
    const rows = await sql`
      SELECT
        id,
        items,
        total,
        status,
        contact_number,
        estimated_arrival,
        estimated_ready,
        rejection_reason,
        created_at
      FROM tray_orders
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
