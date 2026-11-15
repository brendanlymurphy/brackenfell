// Draws the app icons from code (no external art): node tools/icons.mjs
// A dawn valley: pale sun over two ridges, a pine, one timber house with a lit window, on warm ink.
import sharp from 'sharp'; import fs from 'node:fs';
const out = new URL('../icons/', import.meta.url).pathname; fs.mkdirSync(out, { recursive: true });
// motif drawn in a 1024 box; `s` shrinks it toward the centre for the maskable version (platforms crop to a circle or squircle)
const motif = s => `<g transform="translate(512 512) scale(${s}) translate(-512 -512)">
  <circle cx="660" cy="372" r="150" fill="url(#sun)"/>
  <path d="M0 640 L140 520 L230 585 L380 430 L500 540 L610 470 L760 600 L880 520 L1024 620 L1024 1024 L0 1024Z" fill="#4a4032"/>
  <path d="M0 740 L120 650 L250 730 L420 600 L560 700 L700 640 L860 730 L1024 680 L1024 1024 L0 1024Z" fill="#2a241a"/>
  <g fill="#14110d"><path d="M170 810 L214 690 L258 810Z"/><path d="M190 780 L214 700 L238 780Z" fill="#0e0c09"/><rect x="209" y="805" width="10" height="40"/></g>
  <g><rect x="470" y="690" width="170" height="120" fill="#4a3d2c"/><path d="M450 696 L555 612 L660 696Z" fill="#6a5238"/><rect x="540" y="732" width="30" height="40" fill="#f0b45a"/><rect x="500" y="760" width="22" height="50" fill="#2a2218"/></g>
  <path d="M0 860 Q300 800 512 850 T1024 840 L1024 1024 L0 1024Z" fill="#0f0d0a"/>
</g>`;
const svg = (s, ring) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>
  <radialGradient id="bg" cx="0.64" cy="0.36" r="0.95"><stop offset="0" stop-color="#6b4b2c"/><stop offset="0.45" stop-color="#2a2016"/><stop offset="1" stop-color="#14110d"/></radialGradient>
  <radialGradient id="sun"><stop offset="0" stop-color="#fff0c8"/><stop offset="0.55" stop-color="#e9c47a"/><stop offset="1" stop-color="#d8b563" stop-opacity="0"/></radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>${motif(s)}${ring ? '<rect x="40" y="40" width="944" height="944" rx="150" fill="none" stroke="#d8b563" stroke-opacity="0.55" stroke-width="10"/><rect x="66" y="66" width="892" height="892" rx="128" fill="none" stroke="#d8b563" stroke-opacity="0.25" stroke-width="4"/>' : ''}</svg>`;
const png = (name, size, s, ring) => sharp(Buffer.from(svg(s, ring))).resize(size, size).png({ compressionLevel: 9 }).toFile(out + name);
await png('icon-192.png', 192, 1, true); await png('icon-512.png', 512, 1, true); await png('apple-touch-icon.png', 180, 1, false);
await png('maskable-512.png', 512, 0.74, false); await png('favicon-32.png', 32, 1, false);
console.log(fs.readdirSync(out).join(' '));
