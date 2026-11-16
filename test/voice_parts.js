// A remark in front of a villager's own line (IX.SAY) and overheard talk: the recordings that exist are played in turn.
//   node test/shot.mjs --opt webgl=1 --opt play=1 --do "$(cat test/voice_parts.js)"
const out = [], fails = []; const ok = (c, m) => { out.push((c ? 'pass ' : 'FAIL ') + m); if (!c) fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const V = Snd.vox, dt = 1 / 30;
game.step(2, dt); Snd.start(); for (let i = 0; i < 60; i++) game.step(1, dt); await sleep(1500); game.step(3, dt);
ok(!!V.man && Snd.ctx && Snd.ctx.state === 'running', 'manifest and audio ready');
const waitFor = async (fn, ms) => { for (let t = 0; t < ms; t += 100) { if (fn()) return true; await sleep(100); game.step(1, dt); } return fn(); };
// two of hale's recorded lines joined the way IX.SAY joins them; the joined text has no recording of its own
const mine = Object.values(V.man.lines).filter(e => e.s === 'hale' && e.d < 4).slice(0, 2), keyOfFile = f => Object.keys(V.man.lines).find(k => V.man.lines[k].f === f);
const plan = await (await fetch('tools/voice/plan.json')).json(), textOf = f => plan.plan.find(p => p.key === keyOfFile(f)).text;
const a = textOf(mine[0].f), b = textOf(mine[1].f), played = [];
const p0 = V.play; V.play = function (buf, sp) { const h = p0.apply(this, arguments); if (h) played.push(sp + ' ' + buf.duration.toFixed(1)); return h; };
ok(!V.man.lines[V.keyOf('hale', a + '\n\n' + b)], 'the joined text has no recording');
ok(Snd.say(NPC.hale, a + '\n\n' + b) === true, 'joined text is voiced'); await waitFor(() => played.length >= 1, 6000); ok(played.length === 1 && Snd.voiceBusy(), 'first part playing, choices held');
await waitFor(() => played.length >= 2, 9000); ok(played.length === 2, 'second part follows the first (' + played.join(', ') + ')'); await waitFor(() => !Snd.voiceBusy(), 9000); ok(!Snd.voiceBusy(), 'free after the last part');
// a part without a recording is skipped, the rest still plays
played.length = 0; ok(Snd.say(NPC.hale, 'No such remark was ever recorded.\n\n' + b) === true, 'unrecorded remark + recorded line is voiced'); await waitFor(() => played.length >= 1, 6000); await waitFor(() => !Snd.voiceBusy(), 9000); ok(played.length === 1, 'only the recorded part played');
ok(Snd.say(NPC.hale, 'Nothing here.\n\nNor here.') === false, 'nothing recorded: not voiced');
// skipping stops the chain
played.length = 0; Snd.say(NPC.hale, a + '\n\n' + b); await waitFor(() => played.length >= 1, 6000); V.stop(); await sleep(mine[0].d * 1000 + 900); game.step(1, dt); ok(played.length === 1 && !Snd.voiceBusy(), 'a skip ends the whole line');
// overheard notice
played.length = 0; toast('<b>Hale</b>: “' + a + '”'); await waitFor(() => played.length >= 1, 6000); ok(played.length === 1, 'an overheard notice plays its recording'); toast('Just a notice.'); 
V.play = p0;
if (fails.length) throw new Error('VOICE PARTS FAIL ' + JSON.stringify(fails)); return 'voice parts PASSED ' + out.length + ' checks';
