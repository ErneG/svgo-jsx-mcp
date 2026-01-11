#!/usr/bin/env node
/**
 * Generate PNG icons from SVG source
 */

import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

const sizes = [16, 32, 48, 128];

const svgContent = readFileSync(join(iconsDir, 'icon.svg'), 'utf-8');

async function generateIcons() {
  for (const size of sizes) {
    // Render SVG at target size
    const resvg = new Resvg(svgContent, {
      fitTo: {
        mode: 'width',
        value: size,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Ensure exact size with sharp
    const resizedBuffer = await sharp(pngBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    writeFileSync(join(iconsDir, `icon-${size}.png`), resizedBuffer);
    console.log(`Generated icon-${size}.png`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
