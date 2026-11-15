// QA sweep driver. usage:
//   node test/sweep.mjs tour [--area prefix] [--budget 420] [--hours 13,21] [--quality medium]   camera tour: renders every view, saves JPEGs and metrics under /home/claude/shots/qa (resumable)
//   node test/sweep.mjs sheets                                                                      contact sheets from the saved tour
//   node test/sweep.mjs geo | chars | player | quick                                                (see the files in test/qa/)
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
import { open, root, busy } from './qa/harness.mjs';
const argv = process.argv.slice(2), mode = argv[0], arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const OUT = '/home/claude/shots/qa', safe = s => s.replace(/[^A-Za-z0-9.,@_-]+/g, '_');
fs.mkdirSync(OUT + '/img', { recursive: true });
if (mode === 'tour') {
  const hours = arg('hours', '13,21').split(',').map(Number), area = arg('area', ''), budget = +arg('budget', 420) * 1000, t0 = Date.now(), quality = arg('quality', 'medium');
  const dbf = OUT + '/tour.json', db = fs.existsSync(dbf) ? JSON.parse(fs.readFileSync(dbf, 'utf8')) : {};
  const sz = arg('size', '480x219').split('x').map(Number), s = await open({ webgl: 1, quality }, sz);
  const views = JSON.parse(await s.run('return JSON.stringify(QA.views())')).filter(v => v.area.startsWith(area));
  fs.writeFileSync(OUT + '/views.json', JSON.stringify(JSON.parse(await s.run('return JSON.stringify(QA.views())')), null, 0));
  let done = 0, left = 0;
  for (const v of views) for (const h of hours) {
    const key = v.area + '|' + v.id + '|' + h; if (db[key]) continue;
    if (Date.now() - t0 > budget) { left++; continue; }
    let r; try { r = JSON.parse(await s.run(`const v = ${JSON.stringify(v)}; const r = await QA.look(v, ${h}, ${h === 13}); return JSON.stringify({ out: r.out, jpg: QA.jpeg(r.A) });`)); } catch (e) { console.log('FAIL', key, String(e.message).slice(0, 200)); left++; continue; }
    const dir = OUT + '/img/' + safe(v.area); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dir + '/' + safe(v.id) + '_' + h + '.jpg', Buffer.from(r.jpg, 'base64')); db[key] = Object.assign({ v }, r.out); done++;
    if (done % 5 === 0) fs.writeFileSync(dbf, JSON.stringify(db));
  }
  fs.writeFileSync(dbf, JSON.stringify(db)); if (s.msgs.length) console.log('console:', s.msgs.slice(0, 8).join('\n'));
  console.log(`tour: ${done} rendered, ${left} left, ${Object.keys(db).length} total, ${Math.round((Date.now() - t0) / 1000)} s`);
  await s.close(); process.exit(0);
}
if (mode === 'shots') {      // one picture per defect (defects.json from defects.py merge): /home/claude/shots/qa/defects/<id>.jpg, resumable
  const D = JSON.parse(fs.readFileSync(OUT + '/defects.json', 'utf8')), max = +arg('max', 60), budget = +arg('budget', 420) * 1000, t0 = Date.now(); fs.mkdirSync(OUT + '/defects', { recursive: true });
  const todo = D.filter(d => !fs.existsSync(OUT + '/defects/' + d.id + '.jpg') && (d.sev !== 'minor' || arg('minor', 0))).slice(0, max); if (!todo.length) { console.log('shots: nothing to do'); process.exit(0); }
  const s = await open({ webgl: 1, quality: 'medium' }, [640, 292]); let n = 0;
  for (const d of todo) { if (Date.now() - t0 > budget) break;
    try { const jpg = await s.run(`const d = ${JSON.stringify({ c: d.shotcall, h: d.cam ? d.cam[5] : 13 })}; Env.dayLength = 0; Env.hour = d.h; await eval(d.c); const A = await QA.draw(); return QA.jpeg(A);`);
      fs.writeFileSync(OUT + '/defects/' + d.id + '.jpg', Buffer.from(jpg, 'base64')); n++; } catch (e) { console.log('FAIL', d.id, String(e.message).slice(0, 160)); } }
  console.log('shots:', n, 'of', todo.length); await s.close(); process.exit(0);
}
if (mode === 'sheets') { const r = spawnSync('python3', ['-I', root + 'test/qa/sheet.py', OUT], { stdio: 'inherit' }); process.exit(r.status); }
if (mode === 'geo' || mode === 'chars' || mode === 'player') {
  const only = arg('only', ''), s = await open(mode === 'geo' ? { webgl: 1, quality: 'low', audit: 1 } : mode === 'player' ? { webgl: 1, quality: 'low', play: 1 } : { webgl: 1, quality: 'low' });
  const t0 = Date.now(), r = JSON.parse(await s.run(mode === 'geo' ? `return JSON.stringify(QA.geo(${only ? JSON.stringify(only.split(',')) : 'null'}))` : mode === 'player' ? `__game.step(2, 1/30); return JSON.stringify(QA.player(${arg('spots', 40)}, ${arg('secs', 10)}))` : 'return JSON.stringify(QA.chars())'));
  fs.writeFileSync(OUT + '/' + mode + '.json', JSON.stringify(r, null, 1)); const by = {}; for (const d of r.defects) by[d.k] = (by[d.k] || 0) + 1;
  console.log(mode, 'defects', r.defects.length, JSON.stringify(by), JSON.stringify(r.stats), Math.round((Date.now() - t0) / 1000) + 's'); if (s.msgs.length) console.log('console:', s.msgs.slice(0, 6).join('\n'));
  await s.close(); process.exit(0);
}
console.log('unknown mode'); process.exit(2);
