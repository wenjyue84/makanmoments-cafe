/**
 * Seed Chef's Picks display category with curated menu items.
 * Run: node scripts/seed-display-categories.mjs
 */

import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

// Curated Chef's Picks — best of Makan Moments across different categories.
// APY01, CFN01, SK01 don't exist in DB; replaced with AP01, MT01, SF11.
const CHEFS_PICKS_CODES = [
  'BF01',  // KL Curry (Soup) — signature soup
  'BF02',  // KL Curry (Dry) — signature noodle
  'BF04',  // Fish Head With Milk (Soup) — house special
  'CN01',  // Crispy Bee Hoon — popular noodle
  'NS01',  // Shredded Chicken Hor Fun Soup — noodle soup
  'AP01',  // Indonesia Ayam Penyet with rice — rice dish
  'MT01',  // Pineapple Fried Rice — rice dish
  'SF11',  // Thai Style Chicken Wing — snack/side
  'MT04',  // Seafood Tomyum Soup+Rice with Egg
  'TM03',  // Beef Gyu-Don
  'DD02',  // Bubur Cha Cha
  'Thai-styled_green_cu', // Thai-styled green curry rice
];

async function main() {
  // Ensure display_categories table exists and Chef's Picks is seeded
  await sql`
    INSERT INTO display_categories (name, sort_order) VALUES ('Chef''s Picks', 3)
    ON CONFLICT (name) DO NOTHING
  `;

  // Get the Chef's Picks display category ID
  const [chefsCat] = await sql`
    SELECT id FROM display_categories WHERE name ILIKE '%chef%' LIMIT 1
  `;

  if (!chefsCat) {
    console.error('Chef\'s Picks display category not found. Run create-display-categories-tables.ts first.');
    process.exit(1);
  }

  console.log(`Chef's Picks display category ID: ${chefsCat.id}`);

  // Get menu item IDs for the specified codes
  const items = await sql`
    SELECT id, code, name_en FROM menu_items
    WHERE code = ANY(${CHEFS_PICKS_CODES})
  `;

  console.log(`Found ${items.length} of ${CHEFS_PICKS_CODES.length} requested items:`);
  items.forEach(i => console.log(`  ${i.code} — ${i.name_en}`));

  const missing = CHEFS_PICKS_CODES.filter(c => !items.find(i => i.code === c));
  if (missing.length > 0) {
    console.warn(`\nWarning: ${missing.length} item(s) not found in DB: ${missing.join(', ')}`);
  }

  if (items.length === 0) {
    console.error('No items found. Aborting.');
    process.exit(1);
  }

  // Insert into item_display_categories junction table
  let inserted = 0;
  for (const item of items) {
    const result = await sql`
      INSERT INTO item_display_categories (item_id, display_category_id)
      VALUES (${item.id}, ${chefsCat.id})
      ON CONFLICT DO NOTHING
      RETURNING item_id
    `;
    if (result.length > 0) inserted++;
  }

  console.log(`\n✓ Seeded ${inserted} new items into Chef's Picks (${items.length - inserted} already existed)`);

  // Verify
  const assigned = await sql`
    SELECT mi.code, mi.name_en
    FROM item_display_categories idc
    JOIN menu_items mi ON mi.id = idc.item_id
    WHERE idc.display_category_id = ${chefsCat.id}
    ORDER BY mi.sort_order ASC
  `;

  console.log(`\nChef's Picks now contains ${assigned.length} items:`);
  assigned.forEach(i => console.log(`  ${i.code} — ${i.name_en}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
