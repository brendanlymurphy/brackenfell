// Writes tex/s/*.png: the ASTC material pack at half resolution, for the Low tier and low-memory devices (GFX_TEX.tiny in src/10_gfx.js).
// No encoder is needed: every pack file already holds all its mip levels, so the half-size pack is the same file without the first one.
// The files are PNGs used as byte containers (greyscale, 2048 wide, every row with filter 0: see packBlob in 10_gfx.js).
// usage: node tools/tex_half.mjs
import fs from 'node:fs'; import zlib from 'node:zlib';
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'latin1'); data.copy(b, 8); b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const read = f => { const b = fs.readFileSync(f); let o = 8, w = 0, h = 0; const idat = [];
  while (o < b.length) { const len = b.readUInt32BE(o), type = b.toString('latin1', o + 4, o + 8); if (type === 'IHDR') { w = b.readUInt32BE(o + 8); h = b.readUInt32BE(o + 12); } else if (type === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + len)); o += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h); for (let y = 0; y < h; y++) raw.copy(out, y * w, y * (w + 1) + 1, (y + 1) * (w + 1)); return out; };
const write = (f, bytes) => { const W = 2048, H = Math.ceil(bytes.length / W), raw = Buffer.alloc((W + 1) * H); for (let y = 0; y < H; y++) bytes.copy(raw, y * (W + 1) + 1, y * W, Math.min(bytes.length, (y + 1) * W));
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0;
  fs.writeFileSync(f, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])); };
fs.mkdirSync('tex/s', { recursive: true }); let a = 0, b = 0;
for (const f of fs.readdirSync('tex').filter(f => /^[an]_.*\.png$/.test(f))) {
  const d = read('tex/' + f); if (d.readUInt32LE(0) !== 0x58544642) { console.log('skip (not a pack file)', f); continue; }
  const bw = d[4], bh = d[5], res = d.readUInt16LE(6), nm = d[8], size0 = Math.ceil(res / bw) * Math.ceil(res / bh) * 16;
  let total = 0; for (let m = 1, w = res >> 1; m < nm; m++, w = Math.max(1, w >> 1)) total += Math.ceil(w / bw) * Math.ceil(w / bh) * 16;
  const out = Buffer.alloc(16 + total); d.copy(out, 0, 0, 16); out.writeUInt16LE(res >> 1, 6); out[8] = nm - 1; d.copy(out, 16, 16 + size0, 16 + size0 + total);
  write('tex/s/' + f, out); a += fs.statSync('tex/' + f).size; b += fs.statSync('tex/s/' + f).size;
}
console.log('tex pack', (a / 1048576).toFixed(1), 'MB > tex/s', (b / 1048576).toFixed(1), 'MB');
