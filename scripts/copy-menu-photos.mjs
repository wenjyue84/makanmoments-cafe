/**
 * copy-menu-photos.mjs
 * Copies and compresses food photos to public/images/menu/{code}.jpg
 */
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const targetDir = join(projectRoot, "public", "images", "menu");
const freqUsed =
  "C:/Users/Jyue/Documents/2-areas/makan-moments-cafe/3-resources/photos/Frequently used";
const ver45 =
  "C:/Users/Jyue/Documents/2-areas/makan-moments-cafe/3-resources/photos/menu-pages/ver-4.5";

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

const MAPPINGS = [
  { src: `${freqUsed}/tm03 gyudon a5.jpg`, code: "TM03" },
  {
    src: `${freqUsed}/mt04 seafood tomyum soup with rice a5.jpg`,
    code: "MT04",
  },
  { src: `${freqUsed}/mt01 pineapple fried rice a5.jpg`, code: "MT01" },
  { src: `${freqUsed}/dd02 bubur cha cha a5.jpg`, code: "DD02" },
  {
    src: `${freqUsed}/bf22 thai styled green curry rice.jpg`,
    code: "Thai-styled_green_cu",
  },
  { src: `${freqUsed}/ap01nasi ayam penyet a5.jpg`, code: "AP01" },
  { src: `${freqUsed}/sf11 A4 CHICKEN.png`, code: "SF11" },
  { src: `${freqUsed}/bf02 fish slices noodles.jpg`, code: "BF02" },
  { src: `${ver45}/a5 kl curry mee.png`, code: "BF01" },
];

let processed = 0;
let failed = 0;

for (const { src, code } of MAPPINGS) {
  const dest = join(targetDir, `${code}.jpg`);
  if (!existsSync(src)) {
    console.error(`❌ Source not found: ${src}`);
    failed++;
    continue;
  }
  try {
    const info = await sharp(src)
      .resize(800, 600, { fit: "cover", position: "centre" })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // handle PNG transparency
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dest);

    const kb = Math.round(info.size / 1024);
    console.log(
      `✅ ${code}.jpg — ${info.width}x${info.height} — ${kb}KB ${kb > 150 ? "⚠️ OVER 150KB" : ""}`
    );
    processed++;
  } catch (err) {
    console.error(`❌ Failed ${code}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${processed} processed, ${failed} failed.`);
