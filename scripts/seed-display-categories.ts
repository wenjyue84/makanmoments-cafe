/**
 * Seed Chef's Picks display category with curated food items.
 *
 * Run: npx tsx scripts/seed-display-categories.ts
 *
 * Requires DATABASE_URL env var (reads from .env.local automatically).
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local if DATABASE_URL is not already set
if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on environment
  }
}

import { neon } from "@neondatabase/serverless";

const CHEF_PICKS_CODES = [
  "BF01",  // Nasi Lemak Ayam Rempah
  "BF02",  // Thai Basil Chicken Rice
  "BF04",  // Thai Nanyang Curry Chicken Rice
  "CN01",  // Hainanese Chicken Chop
  "APY01", // Ayam Penyet Original
  "NS01",  // Tom Yum Noodle Soup
  "CFN01", // Char Kuey Teow
  "SK01",  // Chicken Satay
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // 1. Find the Chef's Picks display category
  const catRows = await sql`
    SELECT id, name FROM display_categories
    WHERE name ILIKE '%chef%'
    LIMIT 1
  `;

  if (catRows.length === 0) {
    console.error(
      "❌ Chef's Picks display category not found.\n" +
      "   Run: npx tsx scripts/create-display-categories-tables.ts first."
    );
    process.exit(1);
  }

  const chefsPicksId = catRows[0].id as number;
  console.log(`✓ Found Chef's Picks category: id=${chefsPicksId} name="${catRows[0].name}"`);

  // 2. Find the menu items by code
  const itemRows = await sql`
    SELECT id, code, name_en
    FROM menu_items
    WHERE code = ANY(${CHEF_PICKS_CODES})
    ORDER BY code ASC
  `;

  if (itemRows.length === 0) {
    console.error("❌ No matching menu items found. Check that menu items are seeded.");
    process.exit(1);
  }

  console.log(`\n✓ Found ${itemRows.length}/${CHEF_PICKS_CODES.length} items:`);
  for (const row of itemRows) {
    console.log(`   ${(row.code as string).padEnd(8)} ${row.name_en}`);
  }

  const missingCodes = CHEF_PICKS_CODES.filter(
    (code) => !itemRows.some((r) => r.code === code)
  );
  if (missingCodes.length > 0) {
    console.warn(`\n⚠  Missing codes (not in DB): ${missingCodes.join(", ")}`);
  }

  // 3. Insert into junction table
  let inserted = 0;
  for (const row of itemRows) {
    const itemId = row.id as string;
    await sql`
      INSERT INTO item_display_categories (item_id, display_category_id)
      VALUES (${itemId}, ${chefsPicksId})
      ON CONFLICT DO NOTHING
    `;
    inserted++;
  }

  console.log(`\n✓ Seeded ${inserted} item(s) into Chef's Picks (id=${chefsPicksId})`);
  console.log("✓ Done. Open /admin > Categories to verify.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
