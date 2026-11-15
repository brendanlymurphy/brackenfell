// Opens three conversations and checks the right voice file is requested, plays, can be skipped by a tap, and that the choices wait for it.
//   node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/voice_game.js)"
const out = [], fails = []; const ok = (c, m) => { out.push((c ? 'pass ' : 'FAIL ') + m); if (!c) fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const V = Snd.vox, dt = 1 / 30;
game.step(2, dt); Snd.start(); for (let i = 0; i < 60; i++) { game.step(1, dt); } await sleep(1500); game.step(3, dt);
ok(!!V.man, 'manifest loaded (' + (V.man ? Object.keys(V.man.lines).length : 0) + ' lines)'); ok(Snd.ctx && Snd.ctx.state === 'running', 'AudioContext running');
const requested = []; const l0 = V.load; V.load = function (f) { requested.push(f); return l0.apply(this, arguments); };
const waitFor = async (fn, ms) => { for (let t = 0; t < ms; t += 100) { if (fn()) return true; await sleep(100); game.step(1, dt); } return fn(); };
const talk = async (id, mode) => {
  const npc = NPC[id]; requested.length = 0; game.tp(npc.pos[0] + 1.5, npc.pos[2], 270); Player.locked = false; game.step(3, dt); startTalk(npc);
  const text = document.getElementById('dtext').textContent, e = V.man.lines[V.keyOf(id, text)];
  ok(!!e, id + ': the node text has a voice entry'); if (!e) { endTalk(); return; }
  ok(requested.includes(e.f), id + ': requested ' + e.f);
  ok(document.getElementById('dopts').classList.contains('vwait'), id + ': choices wait while the line loads/plays');
  const playing = await waitFor(() => V.cur, 8000); ok(playing, id + ': playing (' + e.d + ' s line)'); ok(V.lastPlayed && V.lastPlayed.file === e.f, id + ': the played file is the manifest file');
  ok(document.body.classList.contains('voiced'), id + ': slim subtitle strip (body.voiced)');
  if (mode === 'skip') { const before = document.getElementById('dtext').textContent; document.getElementById('dialog').click(); await sleep(150); ok(!V.cur, id + ': a tap stops the line'); ok(!document.getElementById('dopts').classList.contains('vwait'), id + ': choices appear after the skip'); ok(UI.talk === npc && document.getElementById('dtext').textContent === before, id + ': the tap did not pick an option'); }
  else { const ended = await waitFor(() => !V.cur && !V.wait, (e.d + 3) * 1000); ok(ended, id + ': choices appear when the line ends'); }
  endTalk(); ok(!V.cur && !document.body.classList.contains('voiced'), id + ': ending the talk stops the voice');
};
await talk('hale', 'skip'); await talk('greta', 'full'); await talk('brandt', 'skip');
// text-only fallback: a node without a recording behaves as before
requested.length = 0; startTalk(NPC.pip); showNode(node('Nothing recorded says this line.')); ok(!V.cur && !document.getElementById('dopts').classList.contains('vwait') && !document.body.classList.contains('voiced'), 'an unrecorded line leaves the text box as it was'); endTalk();
ok(Snd.err === 0, 'no engine errors ' + Snd.errMsg.slice(0, 120)); out.push(fails.length ? 'FAILED ' + fails.length : 'VOICE GAME TEST PASSED'); return out.join('\n');
