import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, sortOrder } = await request.json();

  const rows = await sql`
    UPDATE categories SET
      name = COALESCE(${name ?? null}, name),
      sort_order = COALESCE(${sortOrder ?? null}, sort_order)
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get category name first
  const cat = await sql`SELECT name FROM categories WHERE id = ${id}`;
  if (!cat[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const catName = cat[0].name as string;

  // Remove from all menu items
  await sql`
    UPDATE menu_items
    SET categories = array_remove(categories, ${catName})
    WHERE ${catName} = ANY(categories)
  `;

  // Delete the category
  await sql`DELETE FROM categories WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
