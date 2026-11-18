// [audit] the two ways round the gates on Build 88, at eye height and from above
const st = document.createElement('style'); st.textContent = 'body > *:not(canvas) { visibility: hidden !important; }'; document.head.appendChild(st);
const V = [['edge88_sw_eye', -52, null, 80, 90, 0], ['edge88_sw_above', -50, 18, 92, 45, -40], ['edge88_se_eye', 72, null, 62, 300, 0], ['edge88_se_above', 75, 18, 70, 315, -40], ['edge88_se_bridge', 62.6, null, 20, 0, 0]];
for (const v of V) { game.shot(v[1], v[2], v[3], v[4], v[5], 13); await __snap(v[0]); }
const w = (x, z) => { const s = World.waterAt(x, z); return s > -900 ? +(s - World.groundAt(x, z, s + 2)).toFixed(2) : 'dry'; };
return { sw: [[-40, 82.6, w(-40, 82.6)], [-30, 82.6, w(-30, 82.6)]], se: [[62.6, 57.6, w(62.6, 57.6)], [62.6, 40, w(62.6, 40)], [57, 13.4, w(57, 13.4)]] };
