import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

// 🌱 icon - green rounded square with a sprout
function createIconSvg(size, padding = 0) {
  const p = padding;
  const s = size;
  const inner = s - p * 2;
  const rx = Math.round(inner * 0.2);
  const fontSize = Math.round(inner * 0.55);
  const textY = Math.round(s * 0.52 + fontSize * 0.35);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect x="${p}" y="${p}" width="${inner}" height="${inner}" rx="${rx}" fill="#2E7D32"/>
  <g transform="translate(${s/2}, ${textY})">
    <text font-size="${fontSize}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">누</text>
  </g>
  <circle cx="${s*0.72}" cy="${s*0.28}" r="${s*0.09}" fill="#81C784"/>
  <circle cx="${s*0.68}" cy="${s*0.22}" r="${s*0.05}" fill="#A5D6A7"/>
</svg>`;
}

// Maskable needs extra safe-zone padding (10% each side)
function createMaskableSvg(size) {
  const p = Math.round(size * 0.1);
  return createIconSvg(size, p);
}

const sizes = [192, 512];

for (const size of sizes) {
  // Regular icon
  await sharp(Buffer.from(createIconSvg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`);
  console.log(`✓ icon-${size}x${size}.png`);

  // Maskable icon
  await sharp(Buffer.from(createMaskableSvg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}-maskable.png`);
  console.log(`✓ icon-${size}x${size}-maskable.png`);
}

// Apple touch icon (180x180)
await sharp(Buffer.from(createIconSvg(180)))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('✓ apple-touch-icon.png');

console.log('\nDone! All icons generated.');
