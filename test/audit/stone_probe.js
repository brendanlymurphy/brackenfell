// [audit] Tobin's stone from the foot of the terrace wall, and where the frostcaps are, on the live build
const out = {}; const st = World.interact.find(i => i.id === 'sec.stone'); out.stone = st ? st.p : null;
const gy = World.groundAt(-19, 10.6, 5); Cells.teleport({ p: [-19.0, gy, 10.6], yaw: Math.PI }); game.step(10, 1 / 30);
out.foot = Player.pos.map(v => +v.toFixed(2)); out.promptNoNote = UI.prompt ? (UI.promptLab || UI.prompt.label) : '';
for (let i = 0; i < 40; i++) { Input.keys = { KeyW: true }; game.step(1, 1 / 30); } Input.keys = {}; game.step(3, 1 / 30); out.close = Player.pos.map(v => +v.toFixed(2)); out.promptCloseNoNote = UI.prompt ? (UI.promptLab || UI.prompt.label) : ""; S.flags.sec_bell = 1; game.step(5, 1 / 30); out.promptWithNote = UI.prompt ? (UI.promptLab || UI.prompt.label) : '';
game.shot(-19.0, gy + 1.6, 10.6, 180, -8, 13); await __snap('stone88');
out.frostcaps = World.interact.filter(i => /frostcap/.test(i.id || '')).map(i => [i.id, +i.p[0].toFixed(1), +i.p[2].toFixed(1)]);
out.gates = Object.keys(World.spots).filter(k => /gate/.test(k)).map(k => [k, World.spots[k].p.map(v => +v.toFixed(1))]);
return out;
