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
      SELECT
        id,
        status,
        items,
        total,
        contact_number,
        estimated_arrival,
        estimated_ready,
        rejection_reason,
        created_at
      FROM tray_orders
      WHERE id = ${orderId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let row = rows[0];

    // Auto-expire: if approved but no payment uploaded within 30 minutes, mark as expired
    if (row.status === "approved") {
      const createdAt = new Date(row.created_at as string);
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (createdAt < thirtyMinAgo) {
        await sql`UPDATE tray_orders SET status = 'expired' WHERE id = ${orderId}`;
        row = { ...row, status: "expired" };
      }
    }

    return NextResponse.json({
      id: row.id,
      status: row.status,
      items: row.items,
      total: row.total,
      contactNumber: row.contact_number,
      estimatedArrival: row.estimated_arrival,
      estimatedReady: row.estimated_ready,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error("[GET /api/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
