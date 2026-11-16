// Lip sync: plays three voiced lines (Hale, Greta, Maren) with their mouth-shape tracks and checks that the viseme weights follow the cues and
// return to rest. No audio is needed: the line is posed by setting Snd.vox.cur with a start time in the past. Prints "lipsync PASSED" or the failures.
// run: node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/chars_lineup.js)" --do "$(cat test/lipsync.js)"
const fails = [], IX = h => h.set.vis.index, SH = { A: ['PP'], D: ['aa'], F: ['U'], G: ['FF'], E: ['O'] };
const report = [];
for (const who of ['hale', 'greta', 'maren']) {
  const line = await LU.line(who); if (!line) { fails.push(who + ': no voiced line with a track'); continue; }
  await LU.show(who, 1.6, 0, { face: true, line, at: 0.0 }); const h = LU.cur.h; if (!h.hasVis) { fails.push(who + ': body has no face morphs'); continue; }
  const ix = IX(h), cu = []; { const re = /(\d+)([A-HX])/g; let m; while ((m = re.exec(line.cues))) cu.push([+m[1] / 100, m[2]]); }
  const st = { pos: [4.2, 0, -2.5], yaw: 0, anim: 'idle', scale: 1, zone: 0, light: 1, visible: true, cast: true, look: [0, 0], talking: true }, V = Snd.vox;
  const at = t => { V.cur = { speaker: 'lu.' + who, t0: Snd.now() - t, dur: line.dur, env: line.env, cues: line.cues }; h.face.ci = 0; for (let i = 0; i < 20; i++) { V.cur.t0 = Snd.now() - t; Chars.update(h, st, 0.016); } return Array.from(h.visW); };
  let checked = 0, ok = 0;
  for (let i = 0; i < cu.length - 1 && checked < 40; i++) {
    const [t0, sh] = cu[i], dur = cu[i + 1][0] - t0; if (dur < 0.12 || !SH[sh]) continue;
    const w = at(t0 + Math.min(0.2, dur - 0.02)); checked++; const want = Math.max(...SH[sh].map(n => w[ix[n]]));
    if (want > 0.45) ok++; else fails.push(who + ' ' + sh + ' at ' + t0.toFixed(2) + 's: ' + SH[sh][0] + ' = ' + want.toFixed(2));
  }
  const rest = at(line.dur + 1.5); for (let i = 0; i < 40; i++) { V.cur = null; Chars.update(h, st, 0.016); }
  const after = Math.max(...Array.from(h.visW).slice(0, 19));
  if (after > 0.05) fails.push(who + ': mouth did not return to rest (' + after.toFixed(2) + ')');
  report.push(who + ' ' + ok + '/' + checked + ' cues followed; ' + cu.length + ' cues in ' + line.dur.toFixed(1) + 's; rest ' + after.toFixed(3));
}
return fails.length ? 'lipsync FAILED\n' + fails.join('\n') + '\n' + report.join('\n') : 'lipsync PASSED\n' + report.join('\n');
