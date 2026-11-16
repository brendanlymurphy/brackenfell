// Interior screenshots in ONE browser session: node test/ishots.mjs <outdir> <prefix> '<json list>' [--webgl] [--quality medium]
// each entry: { cell: 'chapel', at: a spot name | [x, z, level] in the plan's canonical frame (the eye is 1.6 m up), yaw: deg in the canonical frame (0 = toward -z, 180 = into the house), pitch, hour, name }
// at: a spot name puts the eye 1.6 m above it. Prints draws / tris per shot.
import { execFileSync } from 'node:child_process';
const [dir, prefix, list] = process.argv.slice(2), flags = process.argv.slice(5), L = JSON.parse(list), args = ['test/shot.mjs', '--timeout', '420000'];
if (flags.includes('--webgl')) args.push('--opt', 'webgl=1'); args.push('--opt', 'quality=' + (flags.includes('--low') ? 'low' : 'medium'));
if (flags.includes('--plans')) args.push('--opt', 'plans=all');
for (let i = 0; i < flags.length; i++) if (flags[i] === '--opt') args.push('--opt', flags[++i]);
let cur = null;
for (const e of L) {
  const nm = `${dir}/${prefix}_${e.name}.png`;
  const js = `${e.cell !== cur ? `game.enter(${JSON.stringify(e.cell)}); ` : ''}const P = World.houses[${JSON.stringify(e.cell)}].plan, a = ${JSON.stringify(e.at)}; let p;
    if (typeof a === 'string') { const s = World.spots[a]; if (!s) throw new Error('no spot ' + a); p = [s.p[0], s.p[1] + 1.6, s.p[2]]; } else { const L = P.lv[a[2] || 0]; p = P.w2(a[0], L.y + 1.6, a[1]); }
    Player.pos = [p[0], p[1] - 1.6, p[2]];
    Env.hour = ${e.hour === undefined ? 13 : e.hour}; if (typeof npcSnapAll === 'function') { npcSnapAll(); for (let i = 0; i < 4; i++) npcUpdate(0.05, Player.pos); }          // the people of the house are where the clock puts them
    const r = await game.shot(p[0], p[1] + ${e.dy || 0}, p[2], ${e.yaw || 0} + P.yaw * 180 / Math.PI, ${e.pitch || 0}, ${e.hour === undefined ? 13 : e.hour}); return '${e.name} ' + r.draws + ' draws ' + (r.tris / 1000 | 0) + 'k';`;
  cur = e.cell; args.push('--do', js, '--out', nm);
}
const o = execFileSync('node', args, { encoding: 'utf8', timeout: 560000, maxBuffer: 1 << 26 });
console.log(o.split('\n').filter(l => /^do:|warn|rror|GPU/i.test(l)).map(l => l.slice(0, 200)).join('\n'));
