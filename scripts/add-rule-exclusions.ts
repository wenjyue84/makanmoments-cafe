/**
 * Migration: Add exclude_item_ids column to rules table.
 * Run: npx tsx scripts/add-rule-exclusions.ts
 *
 * Requires DATABASE_URL env var.
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Adding exclude_item_ids column to rules...");

  await sql`
    ALTER TABLE rules
    ADD COLUMN IF NOT EXISTS exclude_item_ids UUID[] NOT NULL DEFAULT '{}'
  `;

  console.log("Done.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
