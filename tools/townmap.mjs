// Headless town layout: runs the layout files in a vm (no browser) and dumps SITES / roads / INF to JSON for tools/townmap.py and test checks.
// usage: node tools/townmap.mjs [out.json]
import fs from 'node:fs'; import vm from 'node:vm';
const root = new URL('../', import.meta.url).pathname;
const files = ['00_math.js', '55_layout.js', '55b_infill.js', ...fs.readdirSync(root + 'src').filter(f => /^55[c-z]_.*\.js$/.test(f)).sort()];
let code = 'const TEST = null; const window = undefined;\n';
for (const f of files) code += fs.readFileSync(root + 'src/' + f, 'utf8').replace(/^'use strict';/, '') + '\n';
code += '\n;globalThis.__out = { SITES, ROADS, RIVER_PTS, LAKE, SQUARE, FIELDS, BRIDGE, ALLEY, INF: { houses: INF.houses }, TOWN: typeof TOWN !== "undefined" ? TOWN : null, catmull };';
const ctx = vm.createContext({ console, Math });
vm.runInContext(code, ctx);
const o = ctx.__out, out = { SITES: o.SITES, ROADS: o.ROADS.map(r => ({ id: r.id, w: r.w, pts: r.pts, line: o.catmull(r.pts, 1.5) })), RIVER: o.catmull(o.RIVER_PTS, 3), LAKE: o.LAKE, SQUARE: o.SQUARE, FIELDS: o.FIELDS, BRIDGE: o.BRIDGE, TOWN: o.TOWN };
fs.writeFileSync(process.argv[2] || '/tmp/townmap.json', JSON.stringify(out));
console.log('sites', out.SITES.length);
