import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// Public endpoint — no auth required.
// Customers can poll their own order status using the ID returned by POST /api/orders.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, status, created_at
      FROM tray_orders
      WHERE id = ${orderId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json(
      { id: row.id, status: row.status, createdAt: row.created_at },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[GET /api/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
