// Generates PNG icons (192x192, 512x512) from src/icon.svg.
// Run via: node scripts/generate-icons.js
// Re-run whenever icon.svg changes.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'src', 'icon.svg');
const svg = fs.readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  const out = path.join(__dirname, '..', 'src', `icon-${size}.png`);
  sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out)
    .then(() => console.log(`✓ wrote ${out}`))
    .catch((e) => {
      console.error(`✗ ${out}:`, e);
      process.exit(1);
    });
}
