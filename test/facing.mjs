// Which way does each scanned furniture piece face? Puts the painted kit piece (left, the way every placer assumes: front toward +z) and its scan stand-in (right) side by side at turn 0
// on open ground and photographs both from +z (front) and from -z (back), label per piece, into <out>/ (default /home/claude/shots/fin/facing). Read the sheet: a scan whose front is not toward the camera needs ry in its SCANR entry (src/71_kithouse.js).
// usage: node test/facing.mjs [out] [names comma list]      (not part of the gate: it is a picture, and a person reads it)
import fs from 'node:fs';
import { open } from './qa/harness.mjs';
const OUT = process.argv[2] || '/home/claude/shots/fin/facing', only = process.argv[3] && process.argv[3].split(',');
fs.mkdirSync(OUT, { recursive: true });
const s = await open({ webgl: 1, quality: 'medium' }, [640, 360]);
const names = only || JSON.parse(await s.run(`return JSON.stringify(Object.keys(SCANR).filter(k => !SCANR[k].skip))`));
for (const [i, name] of names.entries()) {
  const r = await s.run(`
    const x0 = 62, z0 = -150, gy = Terrain.y(x0, z0), name = ${JSON.stringify(name)};
    if (window.__facing) { SC.scene.remove(window.__facing); window.__facing.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    const grp = new THREE.Group(); window.__facing = grp;
    for (const [dx, scan] of [[-0.9, 0], [0.9, 1]]) {
      TEST.scan = scan ? 1 : 0; const m = { m: new THREE.Matrix4().elements.slice(), m1: 0 }; m.m = new THREE.Matrix4().makeTranslation(x0 + dx, gy, z0).elements.slice();
      const P = kplace(m, name, 0, 0, 0, 1, 0); if (!P) continue;
      const B = Kit.batch({ name: 'facing' +  + (scan ? 's' : 'k'), cell: 40 }); for (const q of [P].concat(P.more || [])) B.add(q.name, q.M, { zone: 0, skyVis: 1, tint: q.tint });
      const g = B.build(); grp.add(g);
    }
    TEST.scan = 1; SC.scene.add(grp);
    QA.hour(10); const out = []; for (const [cz, yaw] of [[3.6, 0], [-3.6, 180]]) { QA.cam(x0, gy + 1.5, z0 + cz, yaw, 8); QA.settle(); const A = await QA.draw(); out.push(QA.jpeg(A)); } return JSON.stringify(out);`);
  JSON.parse(r).forEach((b, k) => fs.writeFileSync(`${OUT}/${String(i).padStart(2, '0')}_${name}_${k ? 'back' : 'front'}.jpg`, Buffer.from(b, 'base64')));
}
console.log('names', names.join(' ')); await s.close();
