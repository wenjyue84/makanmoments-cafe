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
    const { status, action, estimatedReady, rejectionReason } = body as {
      status?: string;
      action?: "approve" | "reject";
      estimatedReady?: string;
      rejectionReason?: string;
    };

    // Legacy: mark as 'seen' (from bell notification)
    if (status === "seen") {
      const rows = await sql`
        UPDATE tray_orders SET status = 'seen' WHERE id = ${orderId} RETURNING id, status
      `;
      if (rows.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    // Approve order
    if (action === "approve") {
      if (!estimatedReady) {
        return NextResponse.json({ error: "estimatedReady is required to approve" }, { status: 400 });
      }
      const readyAt = new Date(estimatedReady);
      if (isNaN(readyAt.getTime())) {
        return NextResponse.json({ error: "estimatedReady is not a valid date" }, { status: 400 });
      }
      const rows = await sql`
        UPDATE tray_orders
        SET status = 'approved', estimated_ready = ${readyAt.toISOString()}
        WHERE id = ${orderId}
        RETURNING id, status, estimated_ready
      `;
      if (rows.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    // Reject order
    if (action === "reject") {
      const reason = (rejectionReason ?? "").trim() || "Order was rejected";
      const rows = await sql`
        UPDATE tray_orders
        SET status = 'rejected', rejection_reason = ${reason}
        WHERE id = ${orderId}
        RETURNING id, status, rejection_reason
      `;
      if (rows.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(rows[0]);
    }

    return NextResponse.json(
      { error: "action must be 'approve' or 'reject', or status must be 'seen'" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
