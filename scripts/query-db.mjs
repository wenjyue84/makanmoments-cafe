import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
const rows = await sql`SELECT code, name_en, featured, sort_order FROM menu_items ORDER BY sort_order ASC, name_en ASC`;
console.log('Total items:', rows.length);
console.log('\nFeatured items:');
rows.filter(r => r.featured).forEach(r => console.log(' ', r.code, r.name_en, 'sort:', r.sort_order));
console.log('\nAll items:');
rows.forEach(r => console.log(r.code.padEnd(8), (r.featured ? '[F]' : '   '), r.sort_order.toString().padEnd(4), r.name_en));
