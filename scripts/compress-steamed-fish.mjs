import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:\\\\Users\\\\Jyue\\\\.gemini\\\\antigravity\\\\brain\\\\66eb31aa-8aed-4665-943a-b6a6a417731f\\\\steamed_fish_promo_1773115632441.png';
const outputPath = 'C:\\\\Users\\\\Jyue\\\\Documents\\\\2-areas\\\\makan-moments-cafe\\\\1-projects\\\\makanmoments.cafe\\\\public\\\\images\\\\hero\\\\hero-mobile.webp';
const blurPath = 'C:\\\\Users\\\\Jyue\\\\Documents\\\\2-areas\\\\makan-moments-cafe\\\\1-projects\\\\makanmoments.cafe\\\\src\\\\data\\\\hero-blur.ts';

async function main() {
    const { data, info } = await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

    fs.writeFileSync(outputPath, data);
    console.log('Saved to', outputPath, 'size:', info.size);

    const blurBuffer = await sharp(inputPath)
        .resize(10, 10, { fit: 'cover' })
        .jpeg({ quality: 40 })
        .toBuffer();

    const blurBase64 = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;

    let blurContent = fs.readFileSync(blurPath, 'utf8');
    // insert new key before the last brace
    blurContent = blurContent.replace('} as const', `  , "heroMobile": "${blurBase64}"\n} as const`);

    fs.writeFileSync(blurPath, blurContent);
    console.log('Updated hero-blur.ts');
}

main().catch(console.error);
