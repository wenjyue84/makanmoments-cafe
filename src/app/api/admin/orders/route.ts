import { NextResponse } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// Protected by middleware — only reachable with a valid admin session.
export async function GET() {
  try {
    // Ensure table exists in case no order has been submitted yet.
    await sql`
      CREATE TABLE IF NOT EXISTS tray_orders (
        id         SERIAL PRIMARY KEY,
        items      JSONB NOT NULL,
        total      NUMERIC(8,2) NOT NULL,
        status     TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const rows = await sql`
      SELECT id, items, total, status, created_at
      FROM tray_orders
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
