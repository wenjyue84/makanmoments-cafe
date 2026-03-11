import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function check() {
  const result = await sql`SELECT id, code, name_en, name_ms, available FROM menu_items WHERE name_en ILIKE '%shredded%' OR name_en ILIKE '%hor fun%'`;
  console.log(result);
}

check().catch(console.error);
