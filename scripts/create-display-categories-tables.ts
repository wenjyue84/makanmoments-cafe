/**
 * Create display_categories and item_display_categories tables.
 * Run: npx tsx scripts/create-display-categories-tables.ts
 *
 * Requires DATABASE_URL env var.
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS display_categories (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active     BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS item_display_categories (
      item_id             UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      display_category_id INTEGER NOT NULL REFERENCES display_categories(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, display_category_id)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_display_categories_item
      ON item_display_categories (item_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_display_categories_category
      ON item_display_categories (display_category_id)
  `;

  // Seed default display categories
  await sql`
    INSERT INTO display_categories (name, sort_order) VALUES
      ('New Items',    1),
      ('Vegetarian',   2),
      ('Chef''s Picks', 3),
      ('Under RM15',   4)
    ON CONFLICT (name) DO NOTHING
  `;

  console.log("✓ display_categories and item_display_categories tables created");
  console.log("✓ Default display categories seeded");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
