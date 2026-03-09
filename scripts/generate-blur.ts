/**
 * Generate blur data URLs for hero images.
 * Run: npx tsx scripts/generate-blur.ts
 * Then copy the output into src/data/hero-blur.ts
 */
import sharp from "sharp";
import path from "path";

const HERO_IMAGES = [
  { name: "featuredDish", file: "featured-dish.jpg" },
  { name: "pineappleFriedRice", file: "pineapple-fried-rice.jpg" },
  { name: "exterior", file: "exterior.jpg" },
];

async function main() {
  const heroDir = path.join(process.cwd(), "public/images/hero");

  for (const img of HERO_IMAGES) {
    const filePath = path.join(heroDir, img.file);
    const buffer = await sharp(filePath)
      .resize(10, 10, { fit: "cover" })
      .jpeg({ quality: 50 })
      .toBuffer();
    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    console.log(`${img.name}: "${base64}"`);
  }
}

main().catch(console.error);
