import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const FEATURED_CODES = ['MT04', 'MT01', 'TM03', 'Thai-styled_green_cu', 'AP01', 'DD02'];

console.log('Setting featured items...');

// Clear all featured flags
await sql`UPDATE menu_items SET featured = false`;
console.log('Cleared all featured flags');

// Set the 6 featured items
const result = await sql`
  UPDATE menu_items
  SET featured = true
  WHERE code = ANY(${FEATURED_CODES})
  RETURNING code, name_en, featured
`;
console.log(`Set ${result.length} items as featured:`);
result.forEach(r => console.log(' ', r.code, '-', r.name_en));

// Verify
const check = await sql`SELECT code, name_en FROM menu_items WHERE featured = true ORDER BY sort_order ASC`;
console.log(`\nVerification - featured items count: ${check.length}`);
check.forEach(r => console.log(' ', r.code, '-', r.name_en));
