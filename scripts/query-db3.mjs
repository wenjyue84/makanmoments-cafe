import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

// Get full code for green curry rice
const rows = await sql`SELECT id, code, name_en FROM menu_items WHERE name_en ILIKE '%green curry rice%'`;
console.log('Green curry rice full data:');
rows.forEach(r => console.log(JSON.stringify(r)));
