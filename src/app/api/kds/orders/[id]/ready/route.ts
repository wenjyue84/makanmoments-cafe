import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// POST /api/kds/orders/:id/ready  — mark order as 'ready' from KDS
// Protected by middleware (KDS session cookie required).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE tray_orders
      SET status = 'ready'
      WHERE id = ${orderId} AND status = 'preparing'
      RETURNING id, status
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Order not found or not in preparing state" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("[POST /api/kds/orders/[id]/ready]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
