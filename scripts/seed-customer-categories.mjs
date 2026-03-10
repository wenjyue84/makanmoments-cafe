/**
 * Seed customer-friendly display categories for the menu filter.
 * Creates 10 categories and maps POS categories → display categories.
 * Run: node scripts/seed-customer-categories.mjs
 */

import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const DISPLAY_CATEGORIES = [
  { name: "Rice Plates",           sort_order: 2 },
  { name: "Noodles",               sort_order: 3 },
  { name: "Nanyang Favourites",    sort_order: 4 },
  { name: "Kopitiam & Toast",      sort_order: 5 },
  { name: "Hot Drinks",            sort_order: 6 },
  { name: "Cold Drinks & Juice",   sort_order: 7 },
  { name: "Sharing Sets",          sort_order: 8 },
  { name: "Snacks",                sort_order: 9 },
  { name: "Desserts",              sort_order: 10 },
];

// POS category arrays per display category
const CATEGORY_MAPPINGS = [
  {
    name: "Rice Plates",
    posCategories: ['Must-Try', 'Try Me', 'Ayam Penyet', '7 Lunch Lovers'],
    extraCodes: [],
  },
  {
    name: "Noodles",
    posCategories: ['Classic Fried Noodles', 'Noodle Soup', 'Break-Lunch'],
    extraCodes: [],
  },
  {
    name: "Nanyang Favourites",
    posCategories: ['Classic Nanyang'],
    extraCodes: [],
  },
  {
    name: "Kopitiam & Toast",
    posCategories: ['Toast', 'Value Set'],
    extraCodes: [],
  },
  {
    name: "Hot Drinks",
    posCategories: ['Beverage Brewing Water (Hot)', 'Beverage Hot Drink'],
    extraCodes: [],
  },
  {
    name: "Cold Drinks & Juice",
    posCategories: ['Beverage Cold Drinks', 'Fresh Fruit Juices'],
    extraCodes: [],
  },
  {
    name: "Sharing Sets",
    posCategories: ['CS', 'Thai Fish Sharing Set'],
    extraCodes: [],
  },
  {
    name: "Snacks",
    posCategories: ['Snack'],
    extraCodes: [],
  },
  {
    name: "Desserts",
    posCategories: ['Ice Cream'],
    extraCodes: ['DD01', 'DD02', 'Gui_lin_gao'],
  },
];

async function main() {
  // Step 1: Upsert all display categories
  console.log('Upserting display categories...');
  for (const cat of DISPLAY_CATEGORIES) {
    await sql`
      INSERT INTO display_categories (name, sort_order, active)
      VALUES (${cat.name}, ${cat.sort_order}, true)
      ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order, active = true
    `;
    console.log(`  ✓ ${cat.name} (sort ${cat.sort_order})`);
  }

  // Step 2: Remove "New Items" display category if it exists
  const deleted = await sql`
    DELETE FROM display_categories WHERE name = 'New Items' RETURNING name
  `;
  if (deleted.length > 0) {
    console.log('\n  ✓ Removed "New Items" display category');
  }

  // Step 3: Map items to each display category
  console.log('\nMapping items to display categories...');

  for (const mapping of CATEGORY_MAPPINGS) {
    // Get the display category ID
    const [cat] = await sql`
      SELECT id FROM display_categories WHERE name = ${mapping.name} LIMIT 1
    `;
    if (!cat) {
      console.warn(`  ✗ Display category "${mapping.name}" not found — skipping`);
      continue;
    }

    // Gather item IDs: by POS categories
    let items = [];
    if (mapping.posCategories.length > 0) {
      const byPos = await sql`
        SELECT id, code, name_en FROM menu_items
        WHERE categories && ${mapping.posCategories}::text[]
      `;
      items = [...items, ...byPos];
    }

    // Gather item IDs: by explicit codes
    if (mapping.extraCodes.length > 0) {
      const byCodes = await sql`
        SELECT id, code, name_en FROM menu_items
        WHERE code = ANY(${mapping.extraCodes})
      `;
      items = [...items, ...byCodes];
    }

    // Deduplicate by id
    const unique = [...new Map(items.map(i => [i.id, i])).values()];

    // Insert into junction table
    let inserted = 0;
    for (const item of unique) {
      const result = await sql`
        INSERT INTO item_display_categories (item_id, display_category_id)
        VALUES (${item.id}, ${cat.id})
        ON CONFLICT DO NOTHING
        RETURNING item_id
      `;
      if (result.length > 0) inserted++;
    }

    console.log(`  ✓ ${mapping.name}: ${unique.length} items found, ${inserted} newly inserted`);
  }

  // Step 4: Summary — show all display categories with counts
  console.log('\n--- Summary ---');
  const summary = await sql`
    SELECT dc.name, dc.sort_order, COUNT(idc.item_id) AS item_count
    FROM display_categories dc
    LEFT JOIN item_display_categories idc ON idc.display_category_id = dc.id
    GROUP BY dc.id, dc.name, dc.sort_order
    ORDER BY dc.sort_order ASC
  `;
  for (const row of summary) {
    console.log(`  [${row.sort_order}] ${row.name}: ${row.item_count} items`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
