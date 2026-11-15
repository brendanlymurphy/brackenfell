const out = {};
const layer = document.getElementById('touch');
const ev = (type, id, x, y) => (type === 'pointerdown' ? layer : window).dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true }));
__game.tp(-40, -4, 90);
const p0 = Player.pos.slice(), y0 = Player.yaw;
ev('pointerdown', 1, 80, 600); ev('pointermove', 1, 80, 540);      // push the stick up = walk forward
ev('pointerdown', 2, 300, 400); ev('pointermove', 2, 240, 400);    // drag left = turn left
__game.step(45, 1 / 30);
out.moved = [+(Player.pos[0] - p0[0]).toFixed(2), +(Player.pos[2] - p0[2]).toFixed(2)]; out.yaw = +(Player.yaw - y0).toFixed(3); out.stick = document.getElementById('stick').style.display; out.touch = Input.touch;
ev('pointerup', 1, 80, 540); ev('pointerup', 2, 240, 400);
__game.step(20, 1 / 30); out.speedAfter = +Player.speed.toFixed(2);
// act button
__game.tp(NPC.hale.pos[0] - 1.6, NPC.hale.pos[2] + 0.2, 90); __game.step(3, 1 / 30);
out.prompt = document.getElementById('actLabel').textContent; out.actHidden = document.getElementById('act').hidden;
return out;
