// Builds the extension with Vite. Each entry is bundled as a standalone IIFE
// (MV3 content scripts can't be ES modules), then the manifest is copied into dist/.
//   node scripts/build.mjs            one-shot build
//   node scripts/build.mjs --watch    rebuild on change
import { build } from 'vite';
import { rmSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

// Entries: [outputName, sourceEntry]
const entries = [
  ['content', 'src/content/index.ts'], // isolated world: UI + fetchers
  ['bridge', 'src/main-world/bridge.ts'], // MAIN world: reads Liferay globals
  ['background', 'src/background.ts'], // service worker: toolbar icon click
  ['options', 'src/options/options.ts'], // settings page script
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

function copyManifest() {
  copyFileSync(resolve(root, 'src/manifest.json'), resolve(outDir, 'manifest.json'));
}
copyManifest();
copyFileSync(resolve(root, 'src/options/options.html'), resolve(outDir, 'options.html'));

// Copy extension icons (generate them first with `npm run icons`).
const iconsSrc = resolve(root, 'public/icons');
const iconsOut = resolve(outDir, 'icons');
mkdirSync(iconsOut, { recursive: true });
for (const file of readdirSync(iconsSrc)) {
  if (file.endsWith('.png')) copyFileSync(resolve(iconsSrc, file), resolve(iconsOut, file));
}

for (const [name, input] of entries) {
  await build({
    root,
    configFile: false,
    logLevel: 'info',
    publicDir: false, // we copy icons explicitly below; don't auto-copy public/
    build: {
      outDir,
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      target: 'chrome111',
      watch: watch ? {} : null,
      lib: {
        entry: resolve(root, input),
        formats: ['iife'],
        name: `LiferayToolkit_${name}`,
        fileName: () => `${name}.js`,
      },
    },
  });
}

console.log(`\n✔ Built to ${outDir}${watch ? ' (watching…)' : ''}`);
