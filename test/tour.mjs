// Eye-height tour for finishing work. usage:
//   node test/tour.mjs --run r1 --set streets|places|doors [--hours 13,21] [--quality medium] [--budget 420] [--size 640x300]
//   node test/tour.mjs --run r1 --cells inn,smithy,...        interiors (chunks of about 8: a software-rendered tab dies after a dozen cells)
//   node test/tour.mjs --run r1 --sheets                       contact sheets of 12 (3 x 4, labelled) from what has been shot
//   node test/tour.mjs --run r1 --views v.json [--force] [--size 960x440]   shoot views from a json file
//   node test/tour.mjs --run r1 --only name1,name2             re-shoot named views (any set, searched in all)
// Pictures: /home/claude/shots/fx2/tour/<run>/<name>_<hour>.jpg ; metrics in meta.json (mean luminance per shot).
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
import { open, root } from './qa/harness.mjs';
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; }, has = k => argv.includes('--' + k);
const run = arg('run', 'r1'), OUT = '/home/claude/shots/fx2/tour/' + run; fs.mkdirSync(OUT, { recursive: true });
const metaF = OUT + '/meta.json', meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF, 'utf8')) : {};
const safe = s => s.replace(/[^A-Za-z0-9.,@_-]+/g, '_');
if (has('sheets')) {
  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.jpg') && !f.startsWith('sheet') && f.startsWith(arg('prefix', ''))).sort(), dir = OUT + '/sheets' + (arg('prefix', '') ? '_' + arg('prefix', '').replace(/\W/g, '') : ''); fs.mkdirSync(dir, { recursive: true });
  const from = +arg('from', 0); let n = 0;
  for (let i = from * 12; i < files.length; i += 12, n++) {
    const part = files.slice(i, i + 12), name = dir + '/sheet' + String(i / 12 + 1).padStart(3, '0') + '.jpg';
    const r = spawnSync('montage', [...part.flatMap(f => ['-label', f.replace('.jpg', ''), OUT + '/' + f]), '-tile', '3x', '-geometry', '+2+2', '-pointsize', '14', '-background', '#111', '-fill', 'white', '-quality', '84', name]); if (r.status) console.log('montage failed', String(r.stderr).slice(0, 200));
  }
  console.log('sheets written to', dir, 'from', files.length, 'shots'); process.exit(0);
}
const hoursOpt = arg('hours', null) ? arg('hours', '').split(',').map(Number) : null, sz = arg('size', '640x300').split('x').map(Number), budget = +arg('budget', 420) * 1000, t0 = Date.now();
const s = await open({ webgl: 1, quality: arg('quality', 'medium') }, sz);
await s.run(fs.readFileSync(root + 'test/tour_views.js', 'utf8'));
const only = arg('only', null) ? arg('only', '').split(',') : null;
let views = [];
if (arg('set', null)) views = JSON.parse(await s.run(`return JSON.stringify(TOUR.set(${JSON.stringify(arg('set'))}))`));
if (arg('views', null)) views = JSON.parse(fs.readFileSync(arg('views'), 'utf8'));          // [{n,x,y,z,yaw,pitch,h:[13],cell?}] ; --force re-shoots
let done = 0, left = 0;
const shoot = async v => {
  for (const h of (hoursOpt || v.h)) {
    const key = safe(v.n) + '_' + h, f = OUT + '/' + key + '.jpg'; if (fs.existsSync(f) && !only && !has('force')) continue;
    if (Date.now() - t0 > budget) { left++; continue; }
    try {
      const r = JSON.parse(await s.run(`const v = ${JSON.stringify(v)}; if (v.cell) { if (!World.cell || World.cell.id !== v.cell) __game.enter(v.cell); } else if (World.cell) __game.leave();
        QA.hour(${h}); QA.cam(v.x, v.y, v.z, v.yaw, v.pitch); QA.settle(); const A = await QA.draw(); const d = A.data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
        return JSON.stringify({ jpg: QA.jpeg(A), lum: +(sum / (d.length / 4)).toFixed(1), st: R.stats && { d: R.stats.draws, t: R.stats.tris } });`));
      fs.writeFileSync(f, Buffer.from(r.jpg, 'base64')); meta[key] = { v, lum: r.lum }; done++;
    } catch (e) { console.log('FAIL', key, String(e.message).slice(0, 160)); left++; }
  }
};
if (only) { const all = []; for (const st of ['streets', 'places', 'doors']) all.push(...JSON.parse(await s.run(`return JSON.stringify(TOUR.set(${JSON.stringify(st)}))`))); for (const c of (arg('incells', '') || '').split(',').filter(Boolean)) { await s.run(`__game.enter(${JSON.stringify(c)}); return 1`); all.push(...JSON.parse(await s.run(`return JSON.stringify(TOUR.cellViews(${JSON.stringify(c)}))`))); } for (const v of all) if (only.some(o => v.n === o || v.n.startsWith(o))) await shoot(v); }
else if (has('mine')) { await s.run(`__game.enter('mine'); __game.step(2, 1/30); return 1`); const vs = JSON.parse(await s.run('return JSON.stringify(TOUR.mineViews())')); for (const v of vs) await shoot(v); }
else if (arg('cells', null)) { for (const id of arg('cells').split(',')) { await s.run(`__game.enter(${JSON.stringify(id)}); __game.step(2, 1/30); return 1`); const vs = JSON.parse(await s.run(`return JSON.stringify(TOUR.cellViews(${JSON.stringify(id)}))`)); for (const v of vs) await shoot(v); } }
else for (const v of views) await shoot(v);
fs.writeFileSync(metaF, JSON.stringify(meta));
if (s.msgs.length) console.log('console:', [...new Set(s.msgs)].slice(0, 6).join('\n'));
console.log(`tour ${run}: ${done} shot, ${left} left, ${Math.round((Date.now() - t0) / 1000)} s`);
await s.close(); process.exit(0);
