// Fixed before/after view set for the lighting work (fork-l1).
// usage: node test/l1shots.mjs <tag> [--webgl] [--quality medium|low] [--vs <basetag>] [--only a,b,c] [--noMine]
// Shots go to /home/claude/shots/l1/<tag>/<name>.png at 844x390; with --vs, side-by-side pairs (before | after) go to
// /home/claude/shots/l1/pairs/<basetag>__<tag>/<name>.png and one contact sheet sheet.jpg beside them.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const argv = process.argv.slice(2), tag = argv[0], flag = k => argv.includes(k), val = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
if (!tag) { console.log('usage: node test/l1shots.mjs <tag> [--webgl] [--quality medium|low] [--vs base] [--only a,b] [--noMine]'); process.exit(1); }
const OUT = '/home/claude/shots/l1', dir = `${OUT}/${tag}`; fs.mkdirSync(dir, { recursive: true });
const only = val('--only') ? val('--only').split(',') : null;
// outdoors: [x, y|null, z, yawDeg, pitchDeg, hour]; "door:<cell>:<metres out>:<hour>:<dy>" = a view of a building's front door from that far away
const VIEWS = [
  { n: 'sq13', v: [4, null, -14, 200, 0, 13] }, { n: 'sq21', v: [4, null, -14, 200, 0, 21] },
  { n: 'alley1730', v: [30, null, -2, 250, 2, 17.5] }, { n: 'terrace13', v: [-12, null, 4, 200, 6, 13] },
  { n: 'house13', door: ['elder', 9, 13] }, { n: 'house21', door: ['elder', 9, 21] }, { n: 'cabin21', door: ['hunter', 8, 21] },
  { n: 'dawn_lane', v: [30, null, -2, 250, 2, 6.4] }, { n: 'lake17', v: [26, 6, 92, 315, -12, 18.2] },
  // interiors, from just inside the street door looking in (canonical plan frame: 180 = into the house)
  { n: 'inn20', cell: 'inn', hour: 20 }, { n: 'inn13', cell: 'inn', hour: 13 }, { n: 'store13', cell: 'store', hour: 13 }, { n: 'store21', cell: 'store', hour: 21 },
  { n: 'chapel13', cell: 'chapel', hour: 13 }, { n: 'chapel21', cell: 'chapel', hour: 21 }, { n: 'house_in13', cell: 'in.21', hour: 13 }, { n: 'house_in21', cell: 'in.21', hour: 21 },
  { n: 'cabin_in21', cell: 'hunter', hour: 21 }, { n: 'smithy18', cell: 'smithy', hour: 18 },
];
const code = e => {
  if (e.v) return `const r = await game.shot(${e.v.map(x => JSON.stringify(x)).join(',')}); return '${e.n} ' + r.draws + ' draws ' + (r.tris / 1000 | 0) + 'k';`;
  if (e.door) return `const c = Cells.by[${JSON.stringify(e.door[0])}], s = c.cs.real, dl = siteDoorLocal(s, ${e.door[1]}), p = siteToWorld(s, dl[0], dl[1]), d0 = siteToWorld(s, ...siteDoorLocal(s, 0)), yaw = Math.atan2(d0[0] - p[0], -(d0[1] - p[1])) * 180 / Math.PI; game.leave && Cells.cur && game.leave();
    const r = await game.shot(p[0], Terrain.y(p[0], p[1]) + 1.65, p[1], yaw, 3, ${e.door[2]}); return '${e.n} ' + r.draws + ' draws ' + (r.tris / 1000 | 0) + 'k';`;
  if (e.cell) return `if (!Cells.cur || Cells.cur.id !== ${JSON.stringify(e.cell)}) game.enter(${JSON.stringify(e.cell)});
    const P = World.houses[${JSON.stringify(e.cell)}].plan, dr = P.doors.find(d => d.b === null) || P.doors[0], L = P.lv[0], p = P.w2(dr.x, L.y + 1.6, 1.3);
    Player.pos = [p[0], p[1] - 1.6, p[2]];
    const r = await game.shot(p[0], p[1], p[2], 180 + P.yaw * 180 / Math.PI, ${e.pitch || 4}, ${e.hour}); return '${e.n} ' + r.draws + ' draws ' + (r.tris / 1000 | 0) + 'k';`;
};
const args = ['test/shot.mjs', '--size', '844x390', '--timeout', '480000'];
if (flag('--webgl')) args.push('--opt', 'webgl=1'); args.push('--opt', 'quality=' + (val('--quality') || 'medium'));

let n = 0;
for (const e of VIEWS) { if (only && !only.includes(e.n)) continue; args.push('--do', code(e), '--out', `${dir}/${e.n}.png`); n++; }
if (!flag('--noMine') && (!only || only.includes('mine'))) {
  args.push('--do', `S.items.lantern = 1; if (typeof MINE_S === 'function') MINE_S().oil = 600; Env.hour = 12; const mc = Cells.by.mine, O = mc.origin, FY = mc.floorY; Cells.teleport({ p: [O[0], FY + 0.1, O[2] + 3], yaw: 0, cell: 'mine' }); for (let i = 0; i < 6; i++) mineTick(1 / 30);
    const r = await game.shot(O[0], FY + 1.6, O[2] + 3, 0, 0, 12); return 'mine ' + r.draws + ' draws ' + (r.tris / 1000 | 0) + 'k lamp ' + (MINE.lamp && MINE.lamp.on);`, '--out', `${dir}/mine.png`); n++;
}
console.log('shooting', n, 'views ->', dir);
let o = ''; try { o = execFileSync('node', args, { encoding: 'utf8', timeout: 590000, maxBuffer: 1 << 26, cwd: new URL('../', import.meta.url).pathname }); } catch (e) { o = (e.stdout || '') + '\n' + (e.stderr || ''); }
console.log(o.split('\n').filter(l => /^do:|warn|rror|GPU|EVAL FAIL|pageerror|console/i.test(l)).map(l => l.slice(0, 220)).join('\n'));
if (val('--vs')) {
  const base = val('--vs'), pd = `${OUT}/pairs/${base}__${tag}`; fs.mkdirSync(pd, { recursive: true });
  const py = `
import sys, os
from PIL import Image, ImageDraw
a, b, out = sys.argv[1], sys.argv[2], sys.argv[3]
names = [f[:-4] for f in sorted(os.listdir(b)) if f.endswith('.png') and os.path.exists(os.path.join(a, f))]
tiles = []
for n in names:
    A = Image.open(os.path.join(a, n + '.png')).convert('RGB'); B = Image.open(os.path.join(b, n + '.png')).convert('RGB')
    im = Image.new('RGB', (A.width * 2 + 4, A.height), (255, 0, 255)); im.paste(A, (0, 0)); im.paste(B, (A.width + 4, 0))
    d = ImageDraw.Draw(im); d.text((6, 4), n + '  before', fill=(255, 255, 0)); d.text((A.width + 10, 4), 'after', fill=(255, 255, 0))
    im.save(os.path.join(out, n + '.png')); tiles.append(im)
cols = 1
if tiles:
    W, H = tiles[0].size; sh = Image.new('RGB', (W, H * len(tiles)))
    for i, t in enumerate(tiles): sh.paste(t, (0, i * H))
    sh.save(os.path.join(out, 'sheet.jpg'), quality=82)
print('pairs', len(tiles))
`;
  fs.writeFileSync('/tmp/l1pairs.py', py);
  console.log(execFileSync('python3', ['-I', '/tmp/l1pairs.py', `${OUT}/${base}`, dir, pd], { encoding: 'utf8' }));
}
