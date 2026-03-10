import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

// PATCH /api/admin/orders/:id  — mark order as 'seen'
// Protected by middleware — only reachable with a valid admin session.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body as { status: string };

    if (status !== "seen") {
      return NextResponse.json({ error: "status must be 'seen'" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE tray_orders
      SET status = ${status}
      WHERE id = ${orderId}
      RETURNING id, status
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
