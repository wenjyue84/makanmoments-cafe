/**
 * compress-hero.mjs — Hero image compression script
 * Converts source JPGs to optimized WebP for hero section
 * Usage: node scripts/compress-hero.mjs
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PHOTOS_BASE =
  "C:/Users/Jyue/Documents/2-areas/makan-moments-cafe/3-resources/photos";
const OUT_DIR = "./public/images/hero";

const images = [
  {
    src: `${PHOTOS_BASE}/Frequently used/mt04 seafood tomyum soup with rice a5.jpg`,
    out: `${OUT_DIR}/featured-dish.webp`,
    label: "featured-dish (Seafood Tom Yum)",
    maxWidth: 800,
  },
  {
    src: `${PHOTOS_BASE}/Frequently used/mt01 pineapple fried rice a5.jpg`,
    out: `${OUT_DIR}/pineapple-fried-rice.webp`,
    label: "pineapple-fried-rice",
    maxWidth: 1200,
  },
  {
    src: `${PHOTOS_BASE}/Must-Try/Thai_styled_green_curry_rice.jpg`,
    out: `${OUT_DIR}/green-curry-rice.webp`,
    label: "green-curry-rice",
    maxWidth: 1200,
  },
];

async function generateBlurDataURL(inputPath) {
  const buffer = await sharp(inputPath)
    .resize(10, 10, { fit: "cover" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

async function main() {
  const blurMap = {};

  for (const img of images) {
    console.log(`Processing: ${img.label}`);

    const { data, info } = await sharp(img.src)
      .resize({ width: img.maxWidth ?? 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    writeFileSync(img.out, data);

    const sizeKB = (info.size / 1024).toFixed(1);
    console.log(
      `  → ${img.out} (${info.width}x${info.height}, ${sizeKB} KB)`
    );

    if (sizeKB > 100) {
      console.warn(`  ⚠ WARNING: ${sizeKB} KB exceeds 100KB target`);
    }

    // Generate blur placeholder
    const blurKey = img.out
      .split("/")
      .pop()
      .replace(".webp", "")
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    blurMap[blurKey] = await generateBlurDataURL(img.src);
    console.log(`  ✓ Blur placeholder generated`);
  }

  // Write blur data to src/data/hero-blur.ts
  const tsContent = `/** Tiny base64 blur placeholders for hero images (10x10px, ~500 bytes each) */

export const HERO_BLUR = ${JSON.stringify(blurMap, null, 2)} as const;
`;

  writeFileSync("./src/data/hero-blur.ts", tsContent);
  console.log("\n✅ hero-blur.ts updated with new placeholders");
  console.log("\nDone! Update hero-section.tsx to use .webp extensions.");
}

main().catch(console.error);
