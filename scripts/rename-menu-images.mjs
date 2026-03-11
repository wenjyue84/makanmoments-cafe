/**
 * rename-menu-images.mjs
 *
 * Renames primary menu images from {code}.ext → {code}-{item-name}.ext
 * so files are human-readable in the file manager.
 *
 * Only PRIMARY images are renamed (i.e. files without a numeric index suffix).
 * Secondary images ({code}-2.webp, {code}-3.webp, etc.) are left unchanged.
 * Files not matching any item code in the DB are skipped.
 *
 * Usage:  node scripts/rename-menu-images.mjs [--dry-run]
 */

import { readFile, readdir, rename, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

// ── Load DATABASE_URL from .env.local ──────────────────────────────────────────
async function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  const content = await readFile(envPath, "utf-8");
  const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env.local");
  return match[1].trim().replace(/^["']|["']$/g, "");
}

// ── Slug helper ────────────────────────────────────────────────────────────────
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// ── Check file exists ──────────────────────────────────────────────────────────
async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const dbUrl = await loadEnv();

  // Dynamically import neon (ESM) — already in project deps
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(dbUrl);

  const rows = await sql`SELECT code, name_en FROM menu_items`;
  const codeToSlug = new Map();
  for (const row of rows) {
    codeToSlug.set(row.code, toSlug(row.name_en));
  }

  const imagesDir = join(ROOT, "public", "images", "menu");
  const files = await readdir(imagesDir);

  let renamed = 0;
  let skipped = 0;
  let alreadyDone = 0;

  for (const file of files) {
    const extMatch = file.match(/\.(jpe?g|png|webp)$/i);
    if (!extMatch) { skipped++; continue; }
    const ext = extMatch[1].toLowerCase();

    // Skip secondary images: {anything}-{digits}.ext
    if (/^.+-\d+\.(jpe?g|png|webp)$/i.test(file)) { skipped++; continue; }

    // Must be primary exact: {code}.ext where code is alphanumeric only (no hyphens/underscores)
    // Files with underscores/hyphens already have a descriptive name — leave them alone.
    const primaryMatch = file.match(/^([A-Z0-9]+)\.(jpe?g|png|webp)$/i);
    if (!primaryMatch) { skipped++; continue; }

    const code = primaryMatch[1];
    const slug = codeToSlug.get(code);
    if (!slug) {
      console.log(`  skip  ${file}  (no DB entry for code "${code}")`);
      skipped++;
      continue;
    }

    const newFile = `${code}-${slug}.${ext}`;
    if (newFile === file) { alreadyDone++; continue; }

    const src = join(imagesDir, file);
    const dst = join(imagesDir, newFile);

    if (await exists(dst)) {
      console.log(`  skip  ${file}  → ${newFile}  (target already exists)`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry] ${file}  →  ${newFile}`);
    } else {
      await rename(src, dst);
      console.log(`  ✓  ${file}  →  ${newFile}`);
    }
    renamed++;
  }

  console.log(`\n${ DRY_RUN ? "[DRY RUN] " : "" }Done:`);
  console.log(`  Renamed:       ${renamed}`);
  console.log(`  Already named: ${alreadyDone}`);
  console.log(`  Skipped:       ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
