/**
 * Create rules table for bulk menu operations.
 * Run: npx tsx scripts/create-rules-table.ts
 *
 * Requires DATABASE_URL env var.
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS rules (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name              TEXT NOT NULL,
      rule_type         TEXT NOT NULL CHECK (rule_type IN ('disable', 'discount', 'featured')),
      target_type       TEXT NOT NULL CHECK (target_type IN ('category', 'items')),
      target_categories TEXT[] NOT NULL DEFAULT '{}',
      target_item_ids   TEXT[] NOT NULL DEFAULT '{}',
      exclude_item_ids  TEXT[] NOT NULL DEFAULT '{}',
      value             NUMERIC NOT NULL DEFAULT 0,
      active            BOOLEAN NOT NULL DEFAULT true,
      starts_at         TIMESTAMPTZ,
      ends_at           TIMESTAMPTZ,
      time_from         TEXT NOT NULL DEFAULT '',
      time_until        TEXT NOT NULL DEFAULT '',
      priority          INTEGER NOT NULL DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_rules_active ON rules (active) WHERE active = true
  `;

  console.log("✓ rules table created");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
