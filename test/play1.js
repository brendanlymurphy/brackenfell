const out = {};
const hold = (keys, secs) => { for (const k of keys) Input.keys[k] = true; __game.step(Math.round(secs * 30), 1 / 30); for (const k of keys) Input.keys[k] = false; };
// 1. the inn door is a portal: walking at it outside stays outside (closed door), entering puts the player in the inn cell on the floor, walking on inside works
__game.tp(0, -13.5, 0); hold(['KeyW'], 4);
out.innDoorClosed = { pos: Player.pos.map(v => +v.toFixed(2)), cell: World.cell && World.cell.id };
__game.enter('inn'); hold(['KeyW'], 2);
out.innEnter = { pos: Player.pos.map(v => +v.toFixed(2)), zone: World.camZone, cell: World.cell && World.cell.id };
if (!World.cell || World.camZone !== World.houses.inn.zone) throw new Error('not inside the inn: ' + JSON.stringify(out.innEnter));
// 2. walk into the wall beside the door
__game.leave(); __game.tp(-4, -13.5, 0); hold(['KeyW'], 3);
out.wall = { pos: Player.pos.map(v => +v.toFixed(2)), zone: World.camZone };
// 3. climb the inn stairs from their foot (inside the cell)
{ const st = World.stairs.find(q => q.id === 'inn.stairs'), a = World.spots[st.bottom], b = World.spots[st.top]; __game.tp(a.p[0], a.p[2], Math.atan2(b.p[0] - a.p[0], -(b.p[2] - a.p[2])) * 180 / Math.PI, 0, a.p[1]); hold(['KeyW'], 4); out.stairs = { pos: Player.pos.map(v => +v.toFixed(2)), top: b.p[1] }; if (Player.pos[1] < b.p[1] - 0.6) throw new Error('did not climb the stairs'); }
__game.leave();
// 4. cross the bridge heading east
__game.tp(48, 2, 90); hold(['KeyW', 'ShiftLeft'], 5);
out.bridge = { pos: Player.pos.map(v => +v.toFixed(2)) };
// 5. try to wade the river away from the bridge
__game.tp(52, 20, 90); hold(['KeyW'], 6);
out.river = { pos: Player.pos.map(v => +v.toFixed(2)), water: +Player.inWater.toFixed(2) };
// 6. run at the world edge
__game.tp(-130, -6, 270); hold(['KeyW', 'ShiftLeft'], 4);
out.edge = { r: +Math.hypot(Player.pos[0], Player.pos[2]).toFixed(1) };
// 7. all dialogue trees evaluate without throwing
out.talk = [];
for (const id in TALK) { if (id === 'buy' || id === 'gretaMenu') continue; try { const n = TALK[id](); if (!n || !n.t) out.talk.push(id + ':empty'); } catch (e) { out.talk.push(id + ':' + e.message); } }
return out;
