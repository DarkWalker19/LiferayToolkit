// Rasterizes public/icons/allen-icon.svg into the PNG sizes Chrome needs.
// Run after changing the SVG:  npm run icons
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/icons');
const svg = readFileSync(resolve(dir, 'allen-icon.svg'), 'utf8');

for (const size of [16, 32, 48, 128]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  writeFileSync(resolve(dir, `icon-${size}.png`), resvg.render().asPng());
  console.log(`✔ icon-${size}.png`);
}
