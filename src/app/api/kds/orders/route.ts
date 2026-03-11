import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// Protected by middleware — KDS auth cookie required.
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
        created_at
      FROM tray_orders
      WHERE status = 'preparing'
      ORDER BY estimated_arrival ASC NULLS LAST
    `;
    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("[GET /api/kds/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
