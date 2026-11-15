// Jitter: z-fighting flips whole regions when the camera moves a hair. For every cell (window.__cells = [...] limits them) render 12 views twice, the second time with the
// camera shifted by 2 mm, and count the pixels that changed by a lot. A sound interior changes only along a few edges. Prints worst and mean fractions; throws above the limit.
// usage: node test/shot.mjs --opt webgl=1 --do "window.__cells=['inn']; $(cat test/jitter.js)"      (on WebGPU headless the frame goes through gfxCapture: no depth buffer there, so run the WebGL backend for this test)
const only = window.__cells, GRID = window.__grid, LIMIT = window.__limit || 0.02, rows = [], bad = [];
Env.dayLength = 0; Env.hour = 13;
const cv2 = document.createElement('canvas'), grab = async () => {
  const env = updateEnv(game.time, 1); env.time = game.time;
  const gpu = G.renderer.backend && G.renderer.backend.isWebGPUBackend; let src;
  if (gpu) { await gfxCapture(() => renderFrame(game.time, env)); src = document.getElementById('testcv'); } else { renderFrame(game.time, env); src = G.canvas; }
  cv2.width = src.width; cv2.height = src.height; const x = cv2.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0); return x.getImageData(0, 0, cv2.width, cv2.height).data;
};
const setCam = (p, yaw) => { R.cam.pos = [p[0], p[1], p[2]]; R.cam.yaw = yaw; R.cam.pitch = -0.05; Player.pos = [p[0], p[1] - 1.6, p[2]]; Cells.sync(R.cam.pos); World.camZone = World.zoneAt(p[0], p[1], p[2]); World.indoor = 1; };
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; return n / (a.length / 4); };
for (const c of Cells.list) {
  if (only && !only.includes(c.id)) continue;
  const sp = Object.values(World.spots).filter(s => s.site === c.id && s.p[0] > CELL.x0 - CELL.half), pick = []; const n = Math.min(6, sp.length);
  for (let i = 0; i < n; i++) pick.push(sp[Math.floor(i * sp.length / n)]);
  const fr = [];
  for (const s of pick) for (const dy of [0, Math.PI]) {
    const p = [s.p[0], s.p[1] + 1.6, s.p[2]], yaw = s.yaw + dy;
    game.enter(c.id); setCam(p, yaw); const A = await grab(); const A2 = await grab(); setCam([p[0] + 0.002, p[1], p[2] + 0.002], yaw); const B = await grab();
    fr.push(+diff(A, B).toFixed(4)); if (GRID && diff(A, B) > LIMIT) { const W = cv2.width, H = cv2.height, gx = 48, gy = 16; let g = ''; for (let j = 0; j < gy; j++) { for (let i = 0; i < gx; i++) { let n = 0, t = 0; for (let y = j * H / gy | 0; y < (j + 1) * H / gy; y++) for (let x = i * W / gx | 0; x < (i + 1) * W / gx; x++) { const k = (y * W + x) * 4; t++; if (Math.abs(A[k] - B[k]) + Math.abs(A[k + 1] - B[k + 1]) + Math.abs(A[k + 2] - B[k + 2]) > 60) n++; } g += n / t > 0.5 ? '#' : n / t > 0.15 ? '+' : n / t > 0.03 ? '.' : ' '; } g += '\n'; } console.log(c.id + ' view ' + fr.length + ' at ' + p.map(v => +v.toFixed(2)) + ' yaw ' + yaw.toFixed(2) + '\n' + g); } if (diff(A, A2) > 0.001) fr.push('noise ' + diff(A, A2).toFixed(4));
  }
  const nums = fr.filter(v => typeof v === 'number'), w = Math.max(...nums), mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  rows.push(c.id + ' views ' + nums.length + ' worst ' + w + ' mean ' + mean.toFixed(4)); if (w > LIMIT) bad.push(c.id + ' ' + JSON.stringify(fr));
}
console.log(rows.join('\n'));
if (bad.length) throw new Error('JITTER FAIL (limit ' + LIMIT + '): ' + bad.join(' | '));
return 'jitter ok ' + rows.length;
