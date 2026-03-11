/**
 * Create admin_users table and seed the default admin account.
 * Run once against production Neon DB:
 *   node scripts/seed-admin-user.mjs
 *
 * Uses the same hardcoded DB URL as other seed scripts.
 * Passwords are hashed with scrypt (Node built-in crypto).
 */

import { neon } from '@neondatabase/serverless';
import { scryptSync, randomBytes } from 'crypto';

const DB_URL = 'postgresql://neondb_owner:npg_a9HTlJp6ifbY@ep-royal-cherry-a1yekkd8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB_URL);

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

async function main() {
  // Create table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id          SERIAL PRIMARY KEY,
      username    TEXT NOT NULL UNIQUE,
      salt        TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'admin',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ admin_users table ready');

  // Seed admin account (admin / admin123)
  const { salt, hash } = hashPassword('admin123');
  const rows = await sql`
    INSERT INTO admin_users (username, salt, password_hash, role)
    VALUES ('admin', ${salt}, ${hash}, 'admin')
    ON CONFLICT (username) DO UPDATE
      SET salt = EXCLUDED.salt,
          password_hash = EXCLUDED.password_hash
    RETURNING username, role
  `;
  console.log(`✓ Admin user upserted: ${rows[0].username} (${rows[0].role})`);
  console.log('\nDone. Login credentials: admin / admin123');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
