const out = {};
const hold = (keys, secs) => { for (const k of keys) Input.keys[k] = true; __game.step(Math.round(secs * 30), 1 / 30); for (const k of keys) Input.keys[k] = false; };
// 1. walk through the inn door
__game.tp(0, -13.5, 0); hold(['KeyW'], 4);
out.innEnter = { pos: Player.pos.map(v => +v.toFixed(2)), zone: World.camZone, door: +World.houses.inn.door.open.toFixed(2) };
// 2. walk into the wall beside the door
__game.tp(-4, -13.5, 0); hold(['KeyW'], 3);
out.wall = { pos: Player.pos.map(v => +v.toFixed(2)), zone: World.camZone };
// 3. climb the inn stairs: start at the foot (local x=-2.7,z=3.55) -> world; inn yaw = PI so world = (-lx, -22 - lz)
__game.tp(2.9, -25.55, 270); hold(['KeyW'], 4);
out.stairs = { pos: Player.pos.map(v => +v.toFixed(2)) };
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
