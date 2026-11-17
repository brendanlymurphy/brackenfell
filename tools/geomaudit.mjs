// Writes docs/GEOMETRY.md: the list of cheap-looking geometry that test/geom.js finds without eyes. usage: node tools/geomaudit.mjs   (after node tools/build.mjs)
import { execFileSync } from 'node:child_process'; import fs from 'node:fs';
const root = new URL('../', import.meta.url).pathname, js = fs.readFileSync(root + 'test/geom.js', 'utf8');
const out = execFileSync('node', ['test/shot.mjs', '--opt', 'webgl=1', '--opt', 'quality=medium', '--do', js], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
const m = out.match(/-> "(.*)" \d+ms/s); if (!m) { console.error(out.slice(-600)); process.exit(1); }
const R = JSON.parse(JSON.parse('"' + m[1] + '"')), head = '| Where (x, y, z) | Material | What | Look at it |\n|---|---|---|---|\n';
const md = `# Cheap-looking geometry: a list made without eyes

Made by \`node tools/geomaudit.mjs\` (the reader is \`test/geom.js\`). It reads the ${R.meshes} static meshes of the town and the wilds out of doors
(${R.tris.toLocaleString('en')} triangles: walls, fences, plots, stalls, steps, the barn, the tower) and lists three kinds of fault. It does not read the modelled kit
pieces, the generated house shells (they are in the kit's batches), the terrain or interiors, and it fixes nothing: each line is for whoever owns
that file. Positions are world metres; the last column is a call to paste in the page's console (or \`test/shot.mjs --do\`) that looks at the place.

Counts now: ${R.counts.stretch} places with stretched texture, ${R.counts.open} with open edges, ${R.counts.sheets} single flat pieces. Each table shows the worst first.

What the three mean and how sure they are:
- **Stretched texture** is measured exactly (metres of surface per repeat of the texture, along each axis of the texture). A face is listed when one axis is
  more than 2.5 times the other, or when it is more than 3 times off what the same material measures elsewhere. Sure.
- **Open edge** is an edge that only one triangle uses, 0.8 m or longer, 0.2 to 3 m above ground a person can stand on: the end or top of a surface with no
  thickness. Cloth, leaves, thatch and shingle are left out (they are sheets by nature). Some entries will be meant (a board nailed flat to a wall has open
  edges that nobody can see): look before fixing.
- **Single flat piece** is a part made of one or two triangles, over 2 m2, not lying on the ground: a wall, a lid or a roof that is one quad.

Metres per repeat, the median for each material (what "usual" means above): ${Object.entries(R.median).map(([k, v]) => k + ' ' + v).join(', ')}.

## Stretched texture (${R.counts.stretch}, worst ${R.stretch.length})

${head}${R.stretch.join('\n')}

## Open edges (${R.counts.open}, worst ${R.open.length})

${head}${R.open.join('\n')}

## Single flat pieces (${R.counts.sheets})

${head}${R.sheets.join('\n')}
`;
fs.writeFileSync(root + 'docs/GEOMETRY.md', md); console.log('docs/GEOMETRY.md: ' + JSON.stringify(R.counts));
