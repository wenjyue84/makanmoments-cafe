import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const {
    code,
    nameEn,
    nameMs,
    nameZh,
    price,
    description,
    dietary,
    categories,
    available,
    featured,
    sortOrder,
    availableDays,
    timeFrom,
    timeUntil,
    specialDates,
    imagePosition,
  } = body;

  // Ensure image_position column exists (idempotent migration)
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT '50% 50%'`;

  const rows = await sql`
    UPDATE menu_items SET
      code = COALESCE(${code ?? null}, code),
      name_en = COALESCE(${nameEn ?? null}, name_en),
      name_ms = COALESCE(${nameMs ?? null}, name_ms),
      name_zh = COALESCE(${nameZh ?? null}, name_zh),
      price = COALESCE(${price ?? null}, price),
      description = COALESCE(${description ?? null}, description),
      dietary = COALESCE(${dietary ?? null}, dietary),
      categories = COALESCE(${categories ?? null}, categories),
      available = COALESCE(${available ?? null}, available),
      featured = COALESCE(${featured ?? null}, featured),
      sort_order = COALESCE(${sortOrder ?? null}, sort_order),
      available_days = COALESCE(${availableDays ?? null}, available_days),
      time_from = COALESCE(${timeFrom ?? null}, time_from),
      time_until = COALESCE(${timeUntil ?? null}, time_until),
      special_dates = COALESCE(${specialDates ?? null}, special_dates),
      image_position = COALESCE(${imagePosition ?? null}, image_position),
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Revalidate ISR cache for menu pages across all locales
  revalidatePath("/en/menu");
  revalidatePath("/ms/menu");
  revalidatePath("/zh/menu");

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`DELETE FROM menu_items WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
