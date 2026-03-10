import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST /api/orders/:id/payment — customer uploads TnG payment screenshot
// Public endpoint (order ID acts as a shared secret, no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Ensure payment_screenshot_url column exists
    await sql`
      ALTER TABLE tray_orders
      ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT
    `;

    // Check order exists and is awaiting payment
    const orderRows = await sql`
      SELECT id, status FROM tray_orders WHERE id = ${orderId} LIMIT 1
    `;
    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const orderStatus = orderRows[0].status as string;
    if (orderStatus !== "approved" && orderStatus !== "payment_pending") {
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 400 }
      );
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get("screenshot") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No screenshot uploaded" },
        { status: 400 }
      );
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG images are accepted" },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 5MB" },
        { status: 400 }
      );
    }

    // Save file to public/uploads/payments/
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `${orderId}.${ext}`;
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "payments"
    );
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const screenshotUrl = `/uploads/payments/${filename}`;

    // Update order status
    await sql`
      UPDATE tray_orders
      SET status = 'payment_uploaded',
          payment_screenshot_url = ${screenshotUrl}
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ ok: true, screenshotUrl });
  } catch (err) {
    console.error("[POST /api/orders/[id]/payment]", err);
    return NextResponse.json(
      { error: "Failed to process payment upload" },
      { status: 500 }
    );
  }
}
