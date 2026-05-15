// Genera el favicon y los iconos de producción a partir de un único SVG.
// Marca: hoja blanca sobre degradado verde (igual que el logo del header).
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(pub, { recursive: true });

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Fauna CITES Perú">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#g)"/>
  <g transform="translate(6 6) scale(0.835)" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="#fff" stroke="none"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" fill="none"/>
  </g>
</svg>`;

writeFileSync(join(pub, 'favicon.svg'), SVG.trim() + '\n');

const png = (size) =>
  new Resvg(SVG, { fitTo: { mode: 'width', value: size } })
    .render()
    .asPng();

// Iconos PNG
const targets = {
  'favicon-16.png': 16,
  'favicon-32.png': 32,
  'favicon-48.png': 48,
  'apple-touch-icon.png': 180,
  'icon-192.png': 192,
  'icon-512.png': 512,
};
for (const [name, size] of Object.entries(targets)) {
  writeFileSync(join(pub, name), png(size));
}

// favicon.ico multi-tamaño (16/32/48)
const ico = await pngToIco([png(16), png(32), png(48)]);
writeFileSync(join(pub, 'favicon.ico'), ico);

// Manifest PWA
const manifest = {
  name: 'Fauna Silvestre CITES · Perú',
  short_name: 'Fauna CITES',
  description:
    'Explorador del Listado de Fauna Silvestre CITES – Perú (MINAM 2023).',
  start_url: '.',
  display: 'standalone',
  background_color: '#022c22',
  theme_color: '#047857',
  icons: [
    { src: 'favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    { src: 'icon-192.png', type: 'image/png', sizes: '192x192' },
    {
      src: 'icon-512.png',
      type: 'image/png',
      sizes: '512x512',
      purpose: 'any maskable',
    },
  ],
};
writeFileSync(
  join(pub, 'site.webmanifest'),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log(
  '[gen-favicon] favicon.svg/.ico + apple-touch + icon-192/512 + site.webmanifest → public/',
);
