import { NextResponse, type NextRequest } from "next/server";
import sql from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const rows = await sql`SELECT * FROM categories ORDER BY sort_order ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const { name, sortOrder = 0 } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO categories (name, sort_order) VALUES (${name}, ${sortOrder})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
