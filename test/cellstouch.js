// The touch flow of a door at 844x390: the interact button shows "Enter ...", a tap on it fades, names the place and puts the player inside; the button then reads "Leave to ...".
// usage: node test/shot.mjs --size 844x390 --opt webgl=1 --opt touch=1 --opt play=1 --do "$(cat test/cellstouch.js)" --out /tmp/touch_cell.png
const sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
const c = Cells.by.inn, x = c.xdoor, yaw = Math.atan2(x.c[0] - x.out[0], -(x.c[2] - x.out[2]));
game.tp(x.out[0], x.out[2], yaw * 180 / Math.PI, 0); game.step(3, 1 / 30);
const a = $('act'); out.outside = { hidden: a.hidden, label: $('actLabel').textContent, key: $('actKey').textContent, box: (r => [r.x | 0, r.y | 0, r.width | 0, r.height | 0])(a.getBoundingClientRect()) };
a.click(); await sleep(450); out.fade = { portal: $('portal').classList.contains('on'), name: $('portalName').textContent, nameOn: $('portalName').classList.contains('on') };
for (let i = 0; i < 400 && Cells.busy; i++) await sleep(50); game.step(3, 1 / 30);
out.inside = { cell: World.cell && World.cell.id, locked: Player.locked, fadeGone: !$('portal').classList.contains('on') };
Player.yaw = Math.atan2(c.door.c[0] - Player.pos[0], -(c.door.c[2] - Player.pos[2])); game.step(3, 1 / 30); out.exit = { hidden: a.hidden, label: $('actLabel').textContent };
if (out.outside.label !== 'Enter ' + c.name || !out.fade.portal || out.inside.cell !== 'inn' || !/^Leave to/.test(out.exit.label)) throw new Error('TOUCH CELL FAIL ' + JSON.stringify(out));
return out;
