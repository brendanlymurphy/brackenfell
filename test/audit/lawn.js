// [audit] Blueprint 4.1 (no lawn inside the town): a picture from straight above, and for every point of a 2 m lattice where it falls in that picture.
// usage: node test/audit/run.mjs --size 1400x1400 --json shots/audit/lawn.json test/audit/lawn.js   then python3 test/audit/lawn.py
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
Weather && Weather.set && Weather.set('fair'); game.shot(0, 230, 1, 0, -89.9, 12.5); await __snap('lawn_top');
const cam = R.camera, v = new THREE.Vector3(), pts = [];
for (let z = -96; z <= 96; z += 2) for (let x = -70; x <= 70; x += 2) { v.set(x, World.groundAt(x, z, 50), z).project(cam); pts.push([x, z, +((v.x + 1) / 2).toFixed(4), +((1 - v.y) / 2).toFixed(4)]); }
return { pts };
