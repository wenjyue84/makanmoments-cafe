import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

// Find full green curry rice code
const rows = await sql`SELECT code, name_en, featured, sort_order FROM menu_items WHERE name_en ILIKE '%green curry%' OR name_en ILIKE '%tomyum%rice%' ORDER BY sort_order ASC`;
console.log('Matching items:');
rows.forEach(r => console.log(JSON.stringify({code: r.code, name: r.name_en, featured: r.featured})));

// Also show current featured count
const featured = await sql`SELECT code, name_en FROM menu_items WHERE featured = true`;
console.log('\nCurrently featured:', featured.length);
featured.forEach(r => console.log(' ', r.code, r.name_en));
