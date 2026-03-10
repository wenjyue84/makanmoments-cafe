import { neon } from '@neondatabase/serverless';

const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB_URL);

// 6 signature dishes — photogenic, representative of cafe's Thai-Malaysian identity
const FEATURED_CODES = [
  'MT04',                  // Seafood Tomyum Soup+Rice with Egg (hero dish)
  'MT01',                  // Pineapple Fried Rice
  'TM03',                  // Beef Gyu-Don
  'AP01',                  // Indonesia Ayam Penyet with rice
  'DD02',                  // Bubur Cha Cha (dessert)
  'Thai-styled_green_cu',  // Thai-styled green curry rice
];

console.log('Step 1: Clear all featured flags...');
await sql`UPDATE menu_items SET featured = false`;
console.log('  Done.');

console.log('\nStep 2: Set featured=true for 6 signature items...');
for (let i = 0; i < FEATURED_CODES.length; i++) {
  const code = FEATURED_CODES[i];
  const result = await sql`
    UPDATE menu_items
    SET featured = true, sort_order = ${i}
    WHERE code = ${code}
    RETURNING code, name_en
  `;
  if (result.length === 0) {
    console.warn(`  WARNING: code "${code}" not found in DB`);
  } else {
    console.log(`  [${i + 1}] ${result[0].code} — ${result[0].name_en}`);
  }
}

console.log('\nStep 3: Verify — SELECT WHERE featured = true:');
const verified = await sql`SELECT code, name_en, featured, sort_order FROM menu_items WHERE featured = true ORDER BY sort_order ASC`;
console.log(`  Total featured: ${verified.length}`);
verified.forEach((r, idx) => console.log(`  ${idx + 1}. [${r.code}] ${r.name_en} (sort_order=${r.sort_order})`));

if (verified.length === 6) {
  console.log('\n✅ Success: Exactly 6 items marked as featured.');
} else {
  console.error(`\n❌ Error: Expected 6, got ${verified.length}`);
  process.exit(1);
}
