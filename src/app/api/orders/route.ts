import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";
import webpush from "web-push";

// Configure VAPID — only if keys are present (skipped in dev without .env.local)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@makanmoments.cafe";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function sendPushToAllAdmins(itemCount: number, total: number) {
  if (!vapidPublicKey || !vapidPrivateKey) return;
  try {
    const subs = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;
    const payload = JSON.stringify({
      title: "🍽 New Order — Makan Moments",
      body: `${itemCount} item${itemCount !== 1 ? "s" : ""} — RM ${total.toFixed(2)}`,
      url: "/admin",
    });
    await Promise.allSettled(
      subs.map((row: { endpoint: string; p256dh: string; auth: string }) =>
        webpush
          .sendNotification(
            {
              endpoint: row.endpoint as string,
              keys: { p256dh: row.p256dh as string, auth: row.auth as string },
            },
            payload
          )
          .catch(async (err: { statusCode?: number }) => {
            // 410 Gone = subscription expired; clean it up
            if (err?.statusCode === 410) {
              await sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint as string}`;
            }
          })
      )
    );
  } catch (err) {
    // Push is best-effort — never fail the order save because of it
    console.warn("[push] sendPushToAllAdmins failed:", err);
  }
}

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

    // Fire-and-forget push notification to all subscribed admins
    void sendPushToAllAdmins(items.length, total);

    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
