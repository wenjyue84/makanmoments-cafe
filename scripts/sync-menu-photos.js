const fs = require("fs");
const path = require("path");

const SOURCE_DIR = "C:/Users/Jyue/Documents/2-areas/makan-moments-cafe/3-resources/photos";
const TARGET_DIR = path.join(__dirname, "../public/images/menu");
const CODE_REGEX = /^([A-Z]{1,4}\d{2,4}[A-Z]*)/;
const DRY_RUN = process.argv.includes("--dry-run");

function scanDir(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDir(full, files);
    else if (/\.(jpg|jpeg)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

let added = 0, updated = 0, skipped = 0;
fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const src of scanDir(SOURCE_DIR)) {
  const basename = path.basename(src);
  const match = basename.match(CODE_REGEX);
  if (!match) { skipped++; continue; }
  const code = match[1];
  const dest = path.join(TARGET_DIR, `${code}.jpg`);
  const exists = fs.existsSync(dest);
  if (!DRY_RUN) fs.copyFileSync(src, dest);
  if (exists) updated++;
  else added++;
  console.log(`${exists ? "UPDATE" : "ADD"} ${code}.jpg`);
}

console.log(`\nDone: +${added} added, ~${updated} updated, ${skipped} skipped`);
