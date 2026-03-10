import { NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";
import sql from "@/lib/db";
import { invalidateSystemPromptCache } from "@/lib/chat/system-prompt";

export const runtime = "nodejs";

// Protected by middleware — only reachable with a valid admin session.
export async function POST() {
  try {
    const rows = await sql`
      SELECT code, name_en, name_ms, name_zh, price, categories, dietary, available
      FROM menu_items
      ORDER BY sort_order ASC
    `;

    // Group items by first category
    const byCategory = new Map<string, typeof rows>();
    for (const row of rows) {
      const cat =
        Array.isArray(row.categories) && row.categories.length > 0
          ? (row.categories[0] as string)
          : "Other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(row);
    }

    const lines: string[] = [
      `# Menu Knowledge (Auto-Generated — ${new Date().toISOString()})`,
      "",
    ];
    for (const [category, items] of byCategory) {
      lines.push(`### ${category}`);
      for (const item of items) {
        const dietary = Array.isArray(item.dietary)
          ? item.dietary.join(", ")
          : (item.dietary ?? "");
        const unavailable = item.available ? "" : " [UNAVAILABLE]";
        lines.push(
          `- ${item.code} ${item.name_en} (${item.name_ms} / ${item.name_zh}) — RM ${item.price}${unavailable}${dietary ? ` | ${dietary}` : ""}`
        );
      }
      lines.push("");
    }

    writeFileSync(
      join(process.cwd(), "knowledge", "menu-knowledge.md"),
      lines.join("\n"),
      "utf-8"
    );

    // Invalidate in-memory cache so next chat picks up fresh data
    invalidateSystemPromptCache();

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    console.error("[sync-ai-knowledge] Failed:", err);
    return NextResponse.json({ error: "Failed to sync AI knowledge" }, { status: 500 });
  }
}
