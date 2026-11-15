// five budget views: prints draws / tris for each. usage: node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/views.js)"
const V = { square: [4, null, -14, 200, 0, 10], alley: [30, null, -2, 250, 2, 17.6], north: [-9, null, -8, 0, 0, 10], lake: [4, null, 66, 175, -3, 10], above: [0, 45, -40, 180, -40, 10] };
const out = [];
for (const k in V) { const s = await game.shot(...V[k]); out.push(k + ' ' + s.draws + ' ' + s.tris); }
return out.join(' | ');
