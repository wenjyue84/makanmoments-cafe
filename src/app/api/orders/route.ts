import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// Public endpoint — no auth required.
// Called by the tray widget when customer clicks "Show Order to Waiter".
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total } = body as {
      items: { id: string; name: string; price: number; quantity: number }[];
      total: number;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }
    if (typeof total !== "number") {
      return NextResponse.json({ error: "total is required" }, { status: 400 });
    }

    // Ensure table exists — idempotent, safe to run on every request.
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
      INSERT INTO tray_orders (items, total)
      VALUES (${JSON.stringify(items)}, ${total})
      RETURNING id, created_at
    `;

    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
