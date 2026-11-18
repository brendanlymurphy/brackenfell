// The gate: everything that must pass before a build is published, as one command.
//   node tools/gate.mjs [--quick | --full] [--cells a,b,c] [--only id,id] [--skip id,id] [--out dir] [--no-build] [--list] [--accept-budget] [--shard k/n]
// --quick   the five-minute subset (build, silent boot, quest, stairs, interiors, voices, budgets on medium, production boot)
// --full    (default) the whole publish list; every interior cell in chunks; the culling check; one WebGPU frame
// --cells   check only these cells (ids as in Cells.list) instead of all of them
// Runs one browser at a time. A failed step is run once more before it counts (software-rendered tabs die now and then); a step that
// only passed on the second try is marked "flaky" in the table. Writes <out>/<step>.log, screenshots and <out>/gate.md; exits 1 on any failure.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname, A = process.argv.slice(2), has = f => A.includes(f), val = f => has(f) ? A[A.indexOf(f) + 1] : null;
const QUICK = has('--quick'), OUT = (val('--out') || 'shots/gate').replace(/\/$/, ''), only = val('--only') && val('--only').split(','), skip = (val('--skip') || '').split(',');
fs.mkdirSync(ROOT + OUT, { recursive: true });
// What the four reference views may cost (draw calls, thousand triangles). Two lines are drawn:
//   TARGET  where the game should be (docs/STATE.md); a view over it is reported as "over target" but does not fail the gate, because the
//           town has been over it since Build 52 and a gate that always fails teaches people to ignore it;
//   tools/gate_budget.json  what the last accepted build measured. A view more than 3% (and 2 draw calls / 2k triangles) worse than that
//           FAILS: nothing may get slower by accident. After a deliberate change run `node tools/gate.mjs --only budget-medium,budget-low
//           --accept-budget` and commit the file, saying why in the commit message.
const TARGET = { medium: [220, 380], low: [140, 200] }, BFILE = ROOT + 'tools/gate_budget.json', ACCEPT = has('--accept-budget');
const BASE = fs.existsSync(BFILE) ? JSON.parse(fs.readFileSync(BFILE, 'utf8')) : {};
const js = f => fs.readFileSync(ROOT + 'test/' + f, 'utf8');
const node = (args, o) => { const r = spawnSync('node', args, Object.assign({ cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 30 * 60e3 }, o || {})); return (r.stdout || '') + (r.stderr || '') + (r.error ? '\n[gate] ' + r.error.message : '') + (r.status ? '\n[gate] exit ' + r.status : ''); };
const shot = (opts, script, extra) => node(['test/shot.mjs', ...opts.flatMap(o => ['--opt', o]), '--do', script, ...(extra || [])]);
const evalFail = out => /EVAL FAIL|\[pageerror\]|\[gate\] (exit|spawn)/.test(out) ? (m => m.length > 620 ? m.slice(0, 160) + ' ... ' + m.slice(-440) : m)((out.match(/EVAL FAIL.*|\[pageerror\].*|\[gate\].*/) || [''])[0]) : null;       /* the start says which test, the end says what failed (the mine test's reason was cut off after its log of what went well) */
// a step returns null (pass) or a short reason (fail); `note` is shown in the table either way
const expect = (re, opts, file, pre) => () => { const out = shot(opts, (pre || '') + js(file)); return { out, fail: evalFail(out) || (re.test(out) ? null : 'did not print ' + re) }; };
const play = ['webgl=1', 'play=1'];
const bot = args => () => { const out = node(['test/playbot.mjs', '--quiet', '--out', OUT + '/bot', ...args]); const m = /playbot: (\d+) bugs \((\d+) S1, (\d+) S2, (\d+) S3\) in (\d+) steps/.exec(out); return { out, fail: !m ? 'the bot did not finish' : /playbot PASS/.test(out) ? null : (out.match(/BUG S[12].*/) || ['failed'])[0].slice(0, 240), note: m ? m[5] + ' steps' + (+m[4] ? ', ' + m[4] + ' minor: ' + (out.match(/BUG S3.*/) || [''])[0].slice(7, 150) : '') + ((out.match(/note: soak.*/) || [''])[0] ? ' ' + out.match(/note: soak.*/)[0].slice(6) : '') : '' }; };
let cellIds = null;
const STEPS = [
  { id: 'build', quick: 1, run: () => { const out = node(['tools/build.mjs']); return { out, fail: /built game\.js/.test(out) ? null : 'build failed', note: (out.match(/phone, Low tier[^|]*\d+\.\d MB/) || [''])[0] }; } },
  { id: 'boot', quick: 1, why: 'no warning or error while the world builds', run: () => { const out = shot(['webgl=1'], 'return 1', ['--out', OUT + '/boot.png']), bad = out.split('\n').filter(l => /warn|rror/i.test(l) && !/GL Driver Message/.test(l)); return { out, fail: evalFail(out) || (bad.length ? bad[0].slice(0, 200) : /ready in/.test(out) ? null : 'did not boot') }; } },
  { id: 'quest', quick: 1, run: expect(/fire 99 bonfire true/, ['webgl=1', 'quality=low'], 'quest.js') },
  { id: 'stairs', quick: 1, run: expect(/stairs PASS/, play, 'stairs.js') },
  { id: 'npcstairs', run: expect(/npcstairs PASS/, play, 'npcstairs.js') },
  { id: 'npcsep', run: expect(/npcsep ok/, play, 'npcsep.js') },
  { id: 'routes', run: expect(/routes PASS/, ['webgl=1', 'quality=medium', 'play=1'], 'routes.js') },
  { id: 'combat', run: expect(/killed [a-z]/, play, 'combat.js') },
  { id: 'wilds', run: expect(/PASS/, play, 'wilds.js') },
  { id: 'story', run: expect(/story PASS/, ['webgl=1', 'quality=medium', 'play=1'], 'story.js') },
  { id: 'mine', run: expect(/mine PASS/, ['webgl=1', 'quality=medium', 'play=1', 'seed=7'], 'mine.js') },
  { id: 'secrets', run: expect(/secrets PASS/, ['webgl=1', 'quality=low', 'play=1'], 'secrets.js') },
  { id: 'interact', run: expect(/interact PASS/, ['webgl=1', 'quality=medium', 'play=1'], 'interact.js') },
  { id: 'econ', run: expect(/econ PASS/, ['webgl=1', 'quality=low', 'play=1'], 'econ.js') },
  { id: 'interiors', quick: 1, run: expect(/interiors ok/, play, 'interiors.js') },
  // [fx1] overlap finder: the counts may only fall (ceilings: severe 0, solid 17; lower them when they fall)
  { id: 'overlap', quick: 1, why: 'solids through solids, blocked doors, spots inside solids', run: () => { const out = shot(['webgl=1', 'quality=low'], js('overlap.js')), sv = +((out.match(/"severe\\?": (\d+)/) || [])[1] ?? 999), so = +((out.match(/"solid\\?": (\d+)/) || [])[1] ?? 0); return { out, fail: sv <= 0 && so <= 17 ? null : 'severe ' + sv + ' (ceiling 0), solid ' + so + ' (ceiling 17)', note: 'severe ' + sv + ' solid ' + so }; } },
  { id: 'doors', why: 'no door leaf flaps: every hinged leaf logged for two minutes at 10 h and 21 h with villagers passing and the player walking the Hart stair, gallery and the inn door edge', run: expect(/doors PASS/, ['webgl=1', 'quality=low', 'play=1'], 'doors.js') },
  { id: 'gaps', why: 'no two houses stand 0.6 to 1.6 m apart (a slot nobody can use or clean)', run: () => { const out = shot(['webgl=1', 'quality=low'], "const __r = await (async () => { " + js('gaps.js') + " })(); return 'gaps bad ' + __r.bad.length + ' party ' + __r.party + ' ' + __r.bad.map(b => b.a + '/' + b.b + ' ' + b.gap).join(', ');"), n = +((out.match(/gaps bad (\d+)/) || [])[1] ?? 999); return { out, fail: evalFail(out) || (n <= 1 ? null : n + ' pairs of houses in the 0.6 to 1.6 m band (ceiling 1: in.12 / in.13)'), note: (out.match(/gaps bad [^"\n]*/) || [''])[0].slice(0, 120) }; } },
  { id: 'shore', why: 'no edge of a water sheet lies visible over ground (alpha under 4 % wherever the ground is within 5 cm)', run: () => { const out = shot(['webgl=1', 'quality=low', 'audit=1'], "const __r = await (async () => { " + js('shore.js') + " })(); return 'shore fails ' + __r.fails + ' ' + (__r.worst || []).slice(0, 3).join(' / ');"), n = +((out.match(/shore fails (\d+)/) || [])[1] ?? 999); return { out, fail: evalFail(out) || (n <= 28 ? null : n + ' water-edge vertices show over ground (ceiling 28: the wilds pools and brook steps, to be faded)'), note: 'water-edge vertices showing: ' + n }; } },
  { id: 'parity', run: () => { const out = node(['test/parity.mjs']); return { out, fail: /parity ok/.test(out) ? null : (out.trim().split('\n').pop() || 'failed').slice(0, 200) }; } },
  { id: 'voice_game', quick: 1, run: expect(/PASSED/, play, 'voice_game.js') },
  { id: 'voice_parts', why: 'a remark before a line, and overheard talk, play their recordings in turn', run: expect(/voice parts PASSED/, play, 'voice_parts.js') },
  { id: 'audio_game', run: expect(/PASSED/, play, 'audio_game.js') },
  { id: 'voices', quick: 1, why: 'every listed voice file exists and is a sane length and level', run: () => { const out = node(['tools/voice/check.mjs', '--allow-missing']); return { out, fail: /voice files ok/.test(out) ? null : (out.match(/\d+ FAILURES/) || ['failed'])[0] + ': ' + (out.match(/FAIL .*/) || [''])[0].slice(0, 120), note: (out.match(/\d+\/\d+ files/) || [''])[0] }; } },
  ...['medium', 'low'].map(q => ({ id: 'budget-' + q, quick: q === 'medium', why: 'draw calls and triangles of the four reference views', run: () => {
    const out = shot(['webgl=1', 'quality=' + q], js('perf_views.js')), m = /-> (\{.*\})/.exec(out); let fail = evalFail(out), note = '';
    if (!fail && !m) fail = 'no numbers'; let warn = '';
    if (m) { const r = JSON.parse(m[1]), over = [], worse = [], now = {}; for (const k in r) { const v = /(\d+) \/ (\d+)k/.exec(r[k]); if (!v) continue; now[k] = [+v[1], +v[2]]; note += k + ' ' + r[k].replace(/ /g, '') + '  ';
        if (+v[1] > TARGET[q][0] || +v[2] > TARGET[q][1]) over.push(k); const b = BASE[q] && BASE[q][k]; if (b && (+v[1] > Math.max(b[0] * 1.03, b[0] + 2) || +v[2] > Math.max(b[1] * 1.03, b[1] + 2))) worse.push(k + ' ' + r[k] + ' (accepted ' + b[0] + ' / ' + b[1] + 'k)'); }
      if (ACCEPT) { BASE[q] = now; fs.writeFileSync(BFILE, JSON.stringify(BASE, null, 1) + '\n'); } else if (worse.length) fail = 'slower than the accepted build: ' + worse.join(', ');
      if (over.length) warn = 'over target ' + TARGET[q][0] + ' / ' + TARGET[q][1] + 'k: ' + over.join(', '); }
    return { out, fail, note: note + (warn ? ' [' + warn + ']' : ''), warn }; } })),
  { id: 'cells', quick: 1, chunks: true },          // expanded below into cells-1 .. cells-n
  { id: 'kitcull', why: 'culling changes no pixel in 16 views', run: () => { fs.mkdirSync(ROOT + OUT + '/kitcull', { recursive: true }); const out = node(['test/kitcull.mjs', OUT + '/kitcull']); return { out, fail: /all \d+ views identical/.test(out) ? null : (out.trim().split('\n').pop() || 'failed').slice(0, 200) }; } },
  { id: 'webgpu', why: 'one frame in the square and one in the inn without a GPU error', run: () => {
    const out = shot(['quality=medium'], "const a = (await game.shot(4, null, -14, 200, 0, 10)).draws; game.enter('inn'); const p = R.cam.pos; const b = (await game.shot(p[0], p[1], p[2], 180, 0, 20)).draws; return ['gpu', G.backend, a, b, window.__gpuErrors().length];", ['--out', OUT + '/webgpu_inn.png']), m = /\["gpu","(\w+)",(\d+),(\d+),(\d+)\]/.exec(out);
    return { out, fail: evalFail(out) || (!m ? 'no result' : m[1] !== 'WebGPU' ? 'ran on ' + m[1] : +m[4] ? m[4] + ' GPU errors' : null), note: m ? m[1] + ' ' + m[2] + ' / ' + m[3] + ' draws' : '' }; } },
  // the play bot (test/playbot.mjs): real keys, clicks and taps. Every bug in docs/BUGS.md that was fixed is held by one of these.
  { id: 'bot-story', quick: 1, why: 'the story to both endings by input, a reload at every checkpoint', run: bot(['--run', 'story,reload']) },
  { id: 'bot-play', why: 'every conversation at seven points of the story, side quests, shop, perks, board, theft and jail, death, other orders, saves of Builds 45, 52, 60, the mine fought through, the nine secrets', run: bot(['--run', 'story,talks,side,crime,death,orders,saves,mine,secrets,moments,logic']) },
  { id: 'bot-phone', why: '844 x 390 with touch, a notch and a home bar: the story by taps, every window fits and can be reached, turning the phone', run: bot(['--run', 'story,phone,life', '--touch', '--size', '844x390']) },
  { id: 'bot-sweep', why: 'E on every seventh thing in the world', run: bot(['--run', 'story,sweep', '--every', '7']) },
  { id: 'bot-soak', why: '30 minutes of play in one page: memory, tick time, people stuck or under the floor', run: bot(['--run', 'story,soak', '--minutes', '30']) },
  { id: 'town', quick: 1, why: 'every street and gate walked end to end both ways by input; no two places on the same level more than 2.5 times the straight line apart on foot; no spawn, door step or fixed camera inside something solid', run: () => { const out = node(['test/walkbot.mjs', '--part', 'streets', '--no-doc', '--out', 'shots/town']); return { out, fail: /town PASS/.test(out) ? null : ((out.match(/FAIL [^\n]*/g) || ['did not finish']).slice(0, 3).join(' ; ')).slice(0, 400), note: (out.match(/town PASS[^\n]*/) || [''])[0].replace('town PASS ', '') }; } },
  { id: 'bridge', quick: 1, why: 'nothing stands in the roadway of the bridge (the arch stood 0.3 m above the cobbles at the crown and hid the far half)', run: () => { const out = shot(['webgl=1', 'quality=low'], js('bridge.js')); return { out, fail: evalFail(out) || (/bridge PASS/.test(out) ? null : 'did not pass'), note: (out.match(/bridge PASS[^"]*/) || [''])[0].replace('bridge PASS ', '').slice(0, 120) }; } },
  { id: 'view', why: 'the windows of a house show the town from where the house stands: drawn once on entering and once an hour, the right way round, nothing per frame', run: () => { const out = shot(['webgl=1', 'quality=low', 'play=1'], js('view.js')); return { out, fail: evalFail(out) || (/view PASS/.test(out) ? null : 'did not pass'), note: (out.match(/view PASS[^"]*/) || [''])[0].replace('view PASS ', '').slice(0, 160) }; } },
  { id: 'cast', quick: 1, why: 'the sixty of docs/PEOPLE.md are in the town by name, everyone has a bed of their own in their own house, nobody answers "...", every line is the table\'s', run: () => { const pre = node(['tools/cast.mjs', '--check']); if (!/in step/.test(pre)) return { out: pre, fail: 'src/54_cast.js is not what docs/PEOPLE.md says (run node tools/cast.mjs)' }; const out = shot(['webgl=1', 'quality=low', 'play=1'], js('cast.js')); return { out: pre + out, fail: evalFail(out) || (/cast PASS/.test(out) ? null : 'did not pass'), note: (out.match(/cast PASS[^"]*/) || [''])[0].replace('cast PASS ', '').slice(0, 160) }; } },
  { id: 'memory', quick: 1, why: 'a greeting is said once, the second greeting once when the story has moved, both kept across a save; Hale\'s first speech is true to where he is', run: () => { const out = shot(['webgl=1', 'quality=low', 'play=1'], js('memory.js')); return { out, fail: evalFail(out) || (/memory PASS/.test(out) ? null : 'did not pass'), note: (out.match(/memory PASS[^"]*/) || [''])[0].replace('memory PASS ', '').slice(0, 160) }; } },
  { id: 'scenes', why: 'the passing scenes of docs/PEOPLE.md: the two people are together at the hour and a player standing by hears every line, once a day', run: () => { const out = shot(['webgl=1', 'quality=low', 'play=1'], js('scenes.js')); return { out, fail: evalFail(out) || (/scenes PASS/.test(out) ? null : 'did not pass'), note: (out.match(/scenes PASS[^"]*/) || [''])[0].replace('scenes PASS ', '').slice(0, 160) }; } },
  { id: 'owners', quick: 1, why: 'houses are somebody\'s: barred at night, a word by day, a challenge and the door at night, no sleeping in an owned bed', run: () => { const out = shot(['webgl=1', 'quality=low', 'play=1'], js('owners.js')); return { out, fail: evalFail(out) || (/owners PASS/.test(out) ? null : 'did not pass'), note: (out.match(/owners PASS[^"]*/) || [''])[0].replace('owners PASS ', '').slice(0, 160) }; } },
  { id: 'embers', why: 'sparks and indoor smoke stay under the ceiling over their own flame, in 16 interiors and outdoors', run: () => { const out = shot(['webgl=1', 'quality=low', 'play=1'], js('embers.js')); return { out, fail: evalFail(out) || (/embers PASS/.test(out) ? null : 'did not pass'), note: (out.match(/embers PASS[^"]*/) || [''])[0].replace('embers PASS ', '').slice(0, 160) }; } },
  { id: 'apart', quick: 1, why: 'every villager, regular and passer-by through a whole day at the game\'s own step: no two bodies within 0.45 m for more than a second, outdoors or indoors', run: () => { const out = shot(['webgl=1', 'quality=medium', 'play=1'], js('apart.js')); return { out, fail: evalFail(out) || (/apart PASS/.test(out) ? null : 'did not pass'), note: (out.match(/apart PASS[^"]*/) || [''])[0].replace('apart PASS ', '').slice(0, 160) }; } },
  { id: 'water', quick: 1, why: 'no place, door step, road or building floor under a water surface; no water sheet drawn over ground the game holds dry', run: () => { const out = shot(['webgl=1', 'quality=low'], js('water.js')); return { out, fail: evalFail(out) || (/water PASS/.test(out) ? null : 'did not pass'), note: (out.match(/water PASS[^"]*/) || [''])[0].replace('water PASS ', '').slice(0, 200) }; } },
  { id: 'cullwalk', why: 'walking and turning: no square of ground, water or props that is in sight is missing from its buffer', run: () => { const out = node(['test/shot.mjs', '--size', '320x160', '--opt', 'webgl=1', '--opt', 'quality=low', '--opt', 'play=1', '--do', js('cullwalk.js')]); return { out, fail: evalFail(out) || (/cullwalk PASS/.test(out) ? null : 'did not pass'), note: (out.match(/cullwalk PASS[^"]*/) || [''])[0].slice(14) }; } },
  { id: 'people', why: 'every villager, hour by hour: a bed, a job, an evening; nobody idle in one spot all day or facing a wall', run: expect(/people PASS/, ['webgl=1', 'quality=low', 'play=1'], 'people.js') },
  { id: 'offline', why: 'second start with the network cut (service worker cache); a new build is noticed', run: () => { const out = node(['test/sw.mjs']); return { out, fail: /SW PASS/.test(out) ? null : (out.match(/SW FAIL.*|Error.*/) || ['no SW PASS'])[0].slice(0, 200) }; } },
  { id: 'real', quick: 1, why: 'production boot, no test hooks, from the folder Pages would serve (tools/site.mjs)', run: () => { const site = node(['tools/site.mjs', '_site', '--no-build']); if (!/site: \d+ files/.test(site)) return { out: site, fail: 'the site folder could not be assembled' };
    const out = site + node(['test/real.mjs', OUT + '/real.png', '--root', '_site']); let fail = 'no status line'; const m = out.match(/\{"backend".*\}/g); if (m) { try { const s = JSON.parse(m[m.length - 1]);       /* the last status line: after Start was pressed */ fail = s.crashed ? 'crashed: ' + (s.errors[0] || '').slice(0, 200) : !s.ready ? 'not ready' : !s.playing ? 'not playing' : s.errors.length ? s.errors[0].slice(0, 200) : null; } catch (e) { fail = 'unreadable status'; } } return { out, fail }; } },
];
// Steps known to be sensitive to timing in a software-rendered tab. They are still required; the table says so when one needed its second try.
// Tests that have failed by chance. mine: the lurker's creaks are random draws ("heard 3x" could be 1x), so the gate runs it with a fixed
// random seed. interact: the guard arrives through a real-time fade; the test now waits for the event (up to 45 s) and no longer sleeps a fixed 1.5 s.
const FLAKY = { mine: 'chance: run with a fixed random seed (seed=7)', interact: 'real-time fade: waits on the event, up to 45 s', story: 'long scripted play; real-time fades' };
if (has('--list')) { for (const s of STEPS) console.log(s.id.padEnd(14), s.quick ? 'quick' : '     ', s.why || '', FLAKY[s.id] ? '(timing-sensitive: ' + FLAKY[s.id] + ')' : ''); process.exit(0); }

let steps = STEPS.filter(s => (!QUICK || s.quick) && (!only || only.includes(s.id) || (s.chunks && only.some(o => /^cells/.test(o)))) && !skip.includes(s.id));
// cells: every interior is entered and left, a chunk of them per browser (a software-rendered tab does not survive much more than a dozen)
{ const i = steps.findIndex(s => s.chunks); if (i >= 0) {
  let ids = val('--cells') ? val('--cells').split(',') : QUICK ? ['inn', 'chapel'] : null;
  if (!ids) { if (!fs.existsSync(ROOT + 'game.js') && !has('--no-build')) node(['tools/build.mjs']); const m = /-> "cells:([^"]*)"/.exec(shot(['webgl=1'], "return 'cells:' + Cells.list.map(c => c.id).join(',')")); ids = m ? m[1].split(',') : ['inn', 'chapel']; }
  const per = 8, chunks = []; for (let k = 0; k < ids.length; k += per) chunks.push(ids.slice(k, k + per));
  steps.splice(i, 1, ...chunks.map((c, k) => ({ id: 'cells-' + (k + 1), why: c.join(' '), run: expect(/cells PASS/, play, 'cells.js', 'window.__cells=' + JSON.stringify(c) + '; window.__noRest=true; ') })));
} }
if (has('--no-build')) steps = steps.filter(s => s.id !== 'build');
// --shard k/n: every n-th step, for running the gate as n jobs side by side on separate machines (GitHub). Each shard builds for itself.
// The steps are dealt out by how long each took on GitHub (seconds, Build 76), longest first into the shard with the least so far: dealt
// in turn, one shard got bot-play (15 min, 30 when its first try fails) on top of a full share and ran 46 min while the others took 20.
const SECS = { 'bot-play': 915, doors: 180, gaps: 107, kitcull: 554, offline: 346, cullwalk: 249, 'bot-soak': 222, 'bot-phone': 199, 'bot-sweep': 160, 'bot-story': 122, real: 76, webgpu: 60, 'budget-medium': 57, 'budget-low': 45, story: 41, stairs: 36, voice_game: 35, voice_parts: 34, town: 32, wilds: 32 };
if (val('--shard')) { const [k, n] = val('--shard').split('/').map(Number), w = s => SECS[s.id] || (/^cells-/.test(s.id) ? 290 : 20), load = new Array(n).fill(0), mine = new Set();
  for (const s of steps.filter(s => s.id !== 'build').sort((a, b) => w(b) - w(a) || (a.id < b.id ? -1 : 1))) { let b = 0; for (let i = 1; i < n; i++) if (load[i] < load[b]) b = i; load[b] += w(s); if (b === k - 1) mine.add(s.id); }
  steps = steps.filter(s => s.id === 'build' || mine.has(s.id)); }

const t0 = Date.now(), rows = []; let failed = 0;
for (const s of steps) {
  const t = Date.now(); let r = s.run(), tries = 1;
  if (r.fail) { fs.writeFileSync(ROOT + OUT + '/' + s.id + '.try1.log', r.out); r = s.run(); tries = 2; }
  fs.writeFileSync(ROOT + OUT + '/' + s.id + '.log', r.out);
  const secs = Math.round((Date.now() - t) / 1000), status = r.fail ? 'FAIL' : tries > 1 ? 'pass (flaky: second try)' : r.warn ? 'pass, over target' : 'pass'; if (r.fail) failed++;
  rows.push({ id: s.id, status, secs, note: (r.fail || r.note || s.why || '').replace(/\|/g, '/').replace(/\s+/g, ' ').slice(0, 260) });
  console.log((r.fail ? 'FAIL ' : 'pass ') + s.id.padEnd(14) + String(secs).padStart(5) + ' s  ' + rows[rows.length - 1].note + (tries > 1 && !r.fail ? '  [second try]' : ''));
}
const total = Math.round((Date.now() - t0) / 1000), head = (failed ? 'GATE FAILED: ' + failed + ' of ' + rows.length + ' steps' : 'GATE PASSED: ' + rows.length + ' steps') + ' in ' + Math.floor(total / 60) + ' min ' + (total % 60) + ' s (' + (QUICK ? 'quick' : 'full') + ')';
const md = ['## ' + head, '', '| Step | Result | Time | Note |', '|---|---|---|---|', ...rows.map(r => '| ' + r.id + ' | ' + r.status + ' | ' + r.secs + ' s | ' + r.note + ' |'), '',
  'Not covered by any step: frame rate on a real phone, flicker and z-fighting in motion, anything audible.'].join('\n');
fs.writeFileSync(ROOT + OUT + '/gate.md', md + '\n'); fs.writeFileSync(ROOT + OUT + '/gate.json', JSON.stringify({ ok: !failed, quick: QUICK, seconds: total, rows }, null, 1));
console.log('\n' + head + '\n' + 'table: ' + OUT + '/gate.md');
process.exit(failed ? 1 : 0);
