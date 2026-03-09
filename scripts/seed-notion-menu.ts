/**
 * Seed Notion Menu Database from POS CSV
 *
 * Usage:
 *   npx tsx scripts/seed-notion-menu.ts
 *
 * Requires .env.local with:
 *   NOTION_API_KEY=ntn_xxx
 *   NOTION_MENU_DB_ID=xxx
 */

import { Client } from "@notionhq/client";
import { readFileSync } from "fs";
import { join } from "path";

// Load env from .env.local, then overlay with process.env
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (val && !process.env[key]) process.env[key] = val;
  }
}

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const NOTION_MENU_DB_ID = process.env.NOTION_MENU_DB_ID || "";

if (!NOTION_API_KEY || !NOTION_MENU_DB_ID) {
  console.error("Missing NOTION_API_KEY or NOTION_MENU_DB_ID in .env.local");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// Proper CSV parser handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(filepath: string) {
  const content = readFileSync(filepath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

// Extract code and name from the Name field (e.g., "AC01 Buttermilk Chicken")
function parseItemName(rawName: string): { code: string; name: string } {
  // Match patterns: AC01, BF22, AFS3, AF06K, AF06L, C224L, TM01B, etc.
  const match = rawName.match(/^([A-Z]{1,4}\d{1,4}[A-Z]?(?:\d[A-Z]?)?)\s+(.+)$/i);
  if (match) {
    return { code: match[1].toUpperCase(), name: match[2] };
  }
  return { code: "", name: rawName };
}

// Column name constants (CSV headers are verbose)
const COL_NAME = "Name";
const COL_VARIANT_KEY =
  "Variant key (Do not modify existed key, blank for base item and added variant)";
const COL_CATEGORY = "Category (create new category if not existed)";
const COL_ORDER_FROM = "Order from (ALL, POS_ONLY, NONE)";
const COL_PRICE = "Selling price";
const COL_ORDER_CODE = "Order code (blank if no code)";

async function seed() {
  const csvPath = join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "3-resources",
    "POS Data",
    "Menu Catalog",
    "menu_25-01-2026_01-17_cafe.csv"
  );

  console.log("Reading CSV from:", csvPath);
  const rows = parseCSV(csvPath);
  console.log(`Total CSV rows: ${rows.length}`);

  // Filter: base items only (no variant key), valid name, not NONE
  const items = rows.filter((r) => {
    const name = r[COL_NAME] || "";
    const variantKey = r[COL_VARIANT_KEY] || "";
    const orderFrom = r[COL_ORDER_FROM] || "";
    return name && !variantKey && orderFrom !== "NONE";
  });

  console.log(`Base items after filtering variants: ${items.length}`);

  // Sort order counters per category
  const categoryOrder: Record<string, number> = {};
  let created = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    const rawName = row[COL_NAME] || "";
    const orderCode = row[COL_ORDER_CODE] || "";
    const { code: parsedCode, name } = parseItemName(rawName);
    const code = orderCode || parsedCode; // Prefer explicit order code
    const category = row[COL_CATEGORY] || "Uncategorized";
    const price = parseFloat(row[COL_PRICE] || "0");

    // Increment sort order per category
    categoryOrder[category] = (categoryOrder[category] || 0) + 1;
    const sortOrder = categoryOrder[category];

    try {
      await notion.pages.create({
        parent: { database_id: NOTION_MENU_DB_ID },
        properties: {
          "Name (EN)": {
            title: [{ text: { content: name } }],
          },
          Code: {
            rich_text: [{ text: { content: code } }],
          },
          "Name (MS)": {
            rich_text: [{ text: { content: "" } }],
          },
          "Name (ZH)": {
            rich_text: [{ text: { content: "" } }],
          },
          Category: {
            select: { name: category },
          },
          Price: {
            number: price,
          },
          Description: {
            rich_text: [{ text: { content: "" } }],
          },
          Available: {
            checkbox: true,
          },
          Featured: {
            checkbox: category === "Must-Try",
          },
          "Sort Order": {
            number: sortOrder,
          },
        },
      });

      created++;
      if (created % 25 === 0) {
        console.log(`Progress: ${created}/${items.length}`);
      }

      // Notion API rate limit: 3 req/sec
      await new Promise((r) => setTimeout(r, 350));
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error creating "${rawName}": ${msg}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Errors: ${errors}`);
  console.log("Categories seeded:", Object.keys(categoryOrder).join(", "));
}

seed().catch(console.error);
