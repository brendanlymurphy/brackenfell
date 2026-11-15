const errs = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const starts = [[-84, -6.5], [0, 0], [0, -21], [-23, -10], [23, -8], [-6, -70], [66, 24], [98, -18], [8, 95], [26, -122], [-70, 44], [38, 8]];
let used = 0, maxY = -99, minY = 99;
for (let run = 0; run < starts.length; run++) {
  __game.tp(starts[run][0], starts[run][1], rnd() * 360);
  for (let i = 0; i < 500; i++) {
    if (i % 25 === 0) { Input.keys = {}; const r = rnd(); if (r < 0.75) Input.keys.KeyW = true; if (r > 0.6) Input.keys.ShiftLeft = true; if (rnd() < 0.2) Input.keys.KeyA = true; Input.lookX = (rnd() - 0.5) * 1.6; }
    try { __game.step(1, 1 / 30); } catch (e) { errs.push(run + ':' + i + ' ' + e.message); break; }
    if (UI.prompt && rnd() < 0.3) { try { interactUse(UI.prompt); used++; if (UI.talk) { for (let k = 0; k < 4 && UI.talk; k++) { const kids = document.getElementById('dopts').children; kids[Math.floor(rnd() * kids.length)].click(); } if (UI.talk) endTalk(); } if (UI.reader) closeReader(); } catch (e) { errs.push('use ' + e.message); } }
    if (!isFinite(Player.pos[0] + Player.pos[1] + Player.pos[2])) { errs.push('NaN pos run ' + run); break; }
    maxY = Math.max(maxY, Player.pos[1]); minY = Math.min(minY, Player.pos[1]);
  }
}
Input.keys = {};
return { errs, used, maxY: +maxY.toFixed(1), minY: +minY.toFixed(1), gold: S.gold, quests: Object.keys(S.q).map(k => k + ':' + qAt(k)).join(' '), gpu: G.errors.length };
