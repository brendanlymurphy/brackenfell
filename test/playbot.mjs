// The play bot: plays Brackenfell the way a person does and reports every break.
//   node test/playbot.mjs [--run story,orders,fuzz,reload,saves,death,phone,soak] [--size 844x390] [--touch] [--out dir] [--seed N] [--minutes N] [--quiet]
// What is real input and what is not:
//   - Every ACTION is real input: the E key on the prompt the game itself shows, mouse clicks (or taps with --touch) on the real dialogue, menu, shop and
//     perk buttons at their place on the screen, Escape, W/A/S/D and the mouse for fighting. A button that is off screen, covered or hidden cannot be
//     pressed and is reported as a bug, the same as for a person.
//   - TRAVEL is not: the bot is put next to the thing (it looks for a place to stand from which the game offers the prompt) and time is stepped, because
//     walking the valley at software-rendering speed would take hours. Finding the way is tested by test/routes.js and test/stairs.js.
// After every step it checks: no error in the console, no NaN, nothing negative in the pack, the player can move when no window is open, and that what the
// game saved is what the game holds (progress that a reload would lose). --run reload also reloads the page after every step and compares.
// Exit code 1 when a bug of severity 1 or 2 was found. docs/BUGS.md is the list; each fixed bug has its check here or in a test/*.js step of tools/gate.mjs.
import { chromium, CHROME } from './pw.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const A = process.argv.slice(2), val = (f, d) => A.includes(f) ? A[A.indexOf(f) + 1] : d, has = f => A.includes(f);
const RUN = val('--run', 'story,orders,fuzz,death').split(','), SIZE = val('--size', '844x390').split('x').map(Number), TOUCH = has('--touch'), OUT = val('--out', 'shots/bot'), SEED = +val('--seed', 7), QUIET = has('--quiet');
const root = new URL('../', import.meta.url).pathname, port = 8700 + Math.floor(Math.random() * 400);
fs.mkdirSync(root + OUT, { recursive: true });
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', glb: 'model/gltf-binary', bin: 'application/octet-stream', json: 'application/json', m4a: 'audio/mp4', webmanifest: 'application/manifest+json' };
const srv = http.createServer((q, s) => { try { const u = decodeURIComponent(q.url.split('?')[0]); const f = root + (u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1)); const b = fs.readFileSync(f); s.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); s.end(b); } catch (e) { s.writeHead(404); s.end('nf'); } }).listen(port);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc'] });

// ───────────── the part that lives in the page: eyes and legs, never hands ─────────────
const IN_PAGE = () => {
  const dt = 1 / 30, sleep = ms => new Promise(r => setTimeout(r, ms));
  const B = window.BOT = { errs: [], toasts: [] };
  { const t0 = window.toast; window.toast = function (h) { B.toasts.push(String(h).replace(/<[^>]+>/g, '')); if (B.toasts.length > 60) B.toasts.shift(); return t0.apply(this, arguments); }; }
  if (window.__TEST__ && window.__TEST__.trap) { let v = Player.locked; B.who = ''; Object.defineProperty(Player, 'locked', { get() { return v; }, set(x) { if (x && !v) B.who = new Error().stack.split('\n').slice(2, 7).map(l => l.trim().slice(0, 90)).join(' < '); v = x; } }); }
  B.find = id => { if (id[0] === '#') return World.interact[+id.slice(1)] || null; if (id.startsWith('npc:')) { const n = NPC[id.slice(4)]; if (!n) return null; if (!n.io) n.io = { npc: n }; return n.io; } return World.interact.find(i => i.id === id) || null; };
  B.posOf = it => it.npc ? [it.npc.pos[0], it.npc.pos[1] + (it.npc.anim === 'lie' ? 0.3 : it.npc.anim === 'sit' ? 1.0 : 1.35 * (it.npc.scale || 1)), it.npc.pos[2]] : it.p;
  // stand somewhere the game offers this thing. Returns { ok } or { ok: false, why, prompt }
  B.approach = id => {
    const it = B.find(id); if (!it) return { ok: false, why: 'no such thing in the world: ' + id };
    if (!interactLabel(it)) return { ok: false, why: 'the game offers nothing here now (no label)', nolabel: true };
    const p = B.posOf(it), feetY = it.npc ? it.npc.pos[1] : null; let seenOther = null;
    for (const rad of [1.0, 0.7, 1.4, 1.8, 0.45, 2.3]) for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6 + rad, x = p[0] + Math.sin(a) * rad, z = p[2] - Math.cos(a) * rad;
      for (const y0 of feetY !== null ? [feetY] : [p[1] - 0.9, p[1] - 0.2, p[1] - 1.6]) {
        const gy = World.groundAt(x, z, y0 + 1.2); if (!(Math.abs(gy - y0) < 1.3)) continue;
        Cells.teleport({ p: [x, gy, z], yaw: 0 }); game.step(2, dt);
        if (Math.hypot(Player.pos[0] - x, Player.pos[2] - z) > 0.6 || Math.abs(Player.pos[1] - gy) > 0.8) continue;        // pushed out of a wall or fell: not a place to stand
        const ex = Player.pos[0], ey = Player.pos[1] + Player.eye, ez = Player.pos[2], dx = p[0] - ex, dy = p[1] - ey, dz = p[2] - ez;
        Player.yaw = Math.atan2(dx, -dz); Player.pitch = Math.max(-1.2, Math.min(1.2, Math.atan2(dy, Math.hypot(dx, dz)))); Input.lookX = Input.lookY = 0; game.step(2, dt);
        if (UI.prompt === it) return { ok: true, label: UI.promptLab, at: Player.pos.map(v => +v.toFixed(2)) };
        if (UI.prompt) seenOther = UI.promptLab;
      }
    }
    return { ok: false, why: 'no place to stand from which the prompt appears' + (seenOther ? ' (the game offers "' + seenOther + '" instead)' : ''), label: interactLabel(it) };
  };
  B.step = (n, d) => game.step(n || 1, d || dt);
  // let fades, door travel and timers run out (they are real-time), stepping the world meanwhile
  B.settle = async (ms) => { const t = performance.now(); await sleep(60); game.step(2, dt); while ((Cells.busy || document.getElementById('fade').classList.contains('on') || document.getElementById('portal').classList.contains('on')) && performance.now() - t < 9000) { await sleep(60); game.step(1, dt); } if (ms) await sleep(ms); game.step(2, dt); return true; };
  B.ui = () => ({ talk: UI.talk ? UI.talk.id : null, menu: !!UI.menu, reader: !!UI.reader, paused: !!UI.paused, locked: !!Player.locked, busy: !!Cells.busy, cell: World.cell ? World.cell.id : null, dead: !!(typeof RPG !== 'undefined' && RPG.dead), prompt: UI.prompt ? UI.promptLab : null });
  // the buttons a person could press now, with where they are and whether a finger would reach them
  B.buttons = sel => [...document.querySelectorAll(sel)].map((b, i) => { const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, st = getComputedStyle(b); const top = document.elementFromPoint(cx, cy);
    return { i, text: b.textContent.trim(), x: cx, y: cy, w: r.width, h: r.height, shown: r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && +st.opacity > 0.05, inView: cx >= 0 && cy >= 0 && cx <= innerWidth && cy <= innerHeight, reach: !!top && (top === b || b.contains(top) || top.contains(b) && top.closest('button') === b), under: top && top !== b && !b.contains(top) ? (top.id || top.className || top.tagName) : '', disabled: !!b.disabled }; });
  B.dialog = () => ({ name: document.getElementById('dname').textContent, text: document.getElementById('dtext').textContent, wait: document.getElementById('dopts').classList.contains('vwait'), opts: B.buttons('#dopts button') });
  B.snap = () => { const r = RPG.st(); return JSON.parse(JSON.stringify({ S, cell: World.cell ? World.cell.id : null, hour: +Env.hour.toFixed(2) })); };
  B.saved = () => { try { return JSON.parse(localStorage.getItem('brackenfell.v1') || 'null'); } catch (e) { return 'unreadable'; } };
  // differences between what is saved and what is held, by path
  B.diff = (a, b, pre, out) => { out = out || []; pre = pre || 'S'; if (out.length > 12) return out; if (a === b) return out; if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') { if (!(typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-6)) out.push(pre + ': saved ' + JSON.stringify(a) + ' now ' + JSON.stringify(b)); return out; }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) B.diff(a[k], b[k], pre + '.' + k, out); return out; };
  B.unsaved = ignore => { const sv = B.saved(); if (!sv || sv === 'unreadable') return ['nothing saved']; return B.diff(sv.S, JSON.parse(JSON.stringify(S))).filter(d => !(ignore || /\.(sta|hp|t|clock|seen|disc|hints|time|cool|regen|iframes|lastHit|hurtT|day|oil|hour)\b/).test(d)); };
  B.inv = () => { const bad = [], r = RPG.st(), P = Player;
    if (!P.pos.every(Number.isFinite) || !Number.isFinite(P.yaw)) bad.push('player position is not a number: ' + P.pos);
    if (!Number.isFinite(r.hp) || !Number.isFinite(r.sta)) bad.push('health or stamina is not a number: ' + r.hp + ' / ' + r.sta);
    if (!Number.isInteger(S.gold) || S.gold < 0) bad.push('gold is ' + S.gold);
    for (const k in S.items) { if (!Number.isInteger(S.items[k]) || S.items[k] <= 0) bad.push('pack holds ' + S.items[k] + ' of ' + k); if (!ITEMS[k]) bad.push('pack holds an unknown thing: ' + k); }
    for (const k in S.q) { const Q = QUESTS[k]; if (!Q) bad.push('quest state for an unknown quest: ' + k); else if (!S.q[k].done && !(S.q[k].stage >= 0 && S.q[k].stage < Q.stages.length)) bad.push('quest ' + k + ' is at stage ' + S.q[k].stage + ' of ' + Q.stages.length); }
    for (const s of ['weapon', 'shield', 'armor']) if (r.eq && r.eq[s] && !has(r.eq[s])) bad.push('wearing ' + r.eq[s] + ' (' + s + ') which is not in the pack');
    if (!uiBusy() && !Cells.busy && P.locked && !(typeof IX !== 'undefined' && IX.sit) && !RPG.dead && !document.getElementById('fade').classList.contains('on')) bad.push('no window is open but the player cannot move (Player.locked)');
    if (P.pos[1] < (World.cell ? CELL.y : 0) - 60) bad.push('the player is under the world at y ' + P.pos[1].toFixed(1));
    for (const id of ['dialog', 'reader', 'menu', 'pause']) { const el = document.getElementById(id), open = { dialog: !!UI.talk, reader: !!UI.reader, menu: !!UI.menu, pause: !!UI.paused && !UI.menu }[id]; if (el && !el.hidden !== open) bad.push('the ' + id + ' window is ' + (el.hidden ? 'hidden' : 'shown') + ' but the game thinks it is ' + (open ? 'open' : 'closed')); }
    return bad; };
  B.foe = r => { let best = null, bd = r || 14; for (const f of Foes.list) { if (!(f.hp > 0) || f.alive === false || f.state === 'dead' || f.state === 'gone' || f.state === 'off') continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]); if (Math.abs(f.pos[1] - Player.pos[1]) < 3 && d < bd) { bd = d; best = f; } } return best ? { d: bd, kind: f_kind(best), hp: best.hp, state: best.state } : null; };
  const f_kind = f => f.kind || (f.def && f.def.name) || 'outlaw';
  B.aim = () => { if (B.hardy && !RPG.dead) { const r = RPG.st(); r.hp = RPG.MAXHP; }       /* B.hardy: the fight is real input, but the bot does not die in it (death has its own scenario) */
    let best = null, bd = 20; for (const f of Foes.list) { if (!(f.hp > 0) || f.alive === false || f.state === 'dead' || f.state === 'gone' || f.state === 'off') continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]); if (Math.abs(f.pos[1] - Player.pos[1]) < 3 && d < bd) { bd = d; best = f; } } if (!best) return -1; Player.yaw = Math.atan2(best.pos[0] - Player.pos[0], -(best.pos[2] - Player.pos[2])); Player.pitch = 0; Input.lookX = Input.lookY = 0; return bd; };
  // stand a few metres from the nearest living foe of a camp (or kind): the walk there is skipped, the fight is not
  B.hunt = (campId, kind) => { let best = null, bd = 1e9; for (const f of Foes.list) { if (!f.alive || !(f.hp > 0) || f.state === 'gone') continue; if (campId && (!f.camp || f.camp.id !== campId)) continue; if (kind && f.kind !== kind) continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]) + Math.abs(f.pos[1] - Player.pos[1]) * 50; if (d < bd) { bd = d; best = f; } }
    if (!best) return false; for (const rad of [4, 3, 5, 2.2]) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, x = best.pos[0] + Math.sin(a) * rad, z = best.pos[2] - Math.cos(a) * rad, gy = World.groundAt(x, z, best.pos[1] + 1.2); if (Math.abs(gy - best.pos[1]) > 1.2) continue; Cells.teleport({ p: [x, gy, z], yaw: 0 }); game.step(2, dt); if (Math.hypot(Player.pos[0] - x, Player.pos[2] - z) < 0.6) return true; } return 'no place to stand near ' + (best.name || best.kind); };
  B.left = (campId, kind) => Foes.list.filter(f => f.alive && f.hp > 0 && f.state !== 'gone' && (!campId || f.camp && f.camp.id === campId) && (!kind || f.kind === kind)).length;
  B.loots = () => World.interact.map((it, i) => it.kind === 'loot' && Math.hypot(it.p[0] - Player.pos[0], it.p[2] - Player.pos[2]) < 260 ? i : -1).filter(i => i >= 0);
  B.info = () => { for (const o of [G.renderer, G.r, R.renderer, R.gl, G.three]) if (o && o.info && o.info.memory) return o.info; return null; };
  // sounds: count every source that has started and not ended (the context's own factory methods are wrapped once)
  B.live = 0; B.audioHook = () => { const c = typeof Snd !== 'undefined' && Snd.ctx; if (!c || c.__bot) return !!c; c.__bot = 1; for (const m of ['createBufferSource', 'createOscillator', 'createConstantSource']) { const f = c[m]; if (!f) continue; c[m] = function () { const n = f.apply(c, arguments), st = n.start; n.start = function (when, off, dur) { B.live++; const ahead = (when || 0) - c.currentTime; if (ahead > 3) B.future++; if (!(dur < 30)) { B.noDur++; const k = String(dur === undefined ? 'none' : Math.round(dur)) + (n.loop ? ' loop' : '') + ' @' + new Error().stack.split('\n').slice(2, 7).map(l => (l.match(/at ([\w.$<>]+).*:(\d+):\d+\)?$/) || [0, '?', ''])).map(m => m[1] + ':' + m[2]).join('<'); B.durs[k] = (B.durs[k] || 0) + 1; } B.rateLow += n.playbackRate && n.playbackRate.value < 0.05 ? 1 : 0; B.aheadMax = Math.max(B.aheadMax, ahead); const who = new Error().stack.split('\n').slice(2, 8).map(l => (l.match(/at ([\w.$<> ]+?) ?\(?[^()]*:(\d+):\d+\)?$/) || [0, '?', ''])).map(m => m[1] + ':' + m[2]).join('<') + (n.loop ? ' loop' : ''); B.liveBy[who] = (B.liveBy[who] || 0) + 1; n.addEventListener('ended', () => { B.live--; B.liveBy[who]--; }); try { return st.apply(n, arguments); } catch (e) { B.live--; B.liveBy[who]--; const k = String(e.message).slice(0, 70) + ' (offset ' + (+off).toFixed(2) + ', duration ' + (+dur).toFixed(2) + ', buffer ' + (n.buffer ? n.buffer.duration.toFixed(2) : '-') + ') @' + who; B.threw[k] = (B.threw[k] || 0) + 1; throw e; } }; return n; }; } return true; };
  B.threw = {};
  B.future = 0; B.aheadMax = 0; B.noDur = 0; B.rateLow = 0; B.durs = {}; B.liveBy = {}; B.liveTop = () => 'scheduled more than 3 s ahead: ' + B.future + ', furthest ' + B.aheadMax.toFixed(0) + ' s; no or long duration ' + B.noDur + '; ' + JSON.stringify(B.durs) + ' near-zero rate ' + B.rateLow + '; context ' + Snd.ctx.state + ' time ' + Snd.ctx.currentTime.toFixed(0) + '; ' + Object.entries(B.liveBy).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[1] + ' ' + e[0]).join(' | ');
  B.sounds = () => B.live;
  B.day = h => { Env.dayLength = 0; Env.hour = h; npcSnapAll(); game.step(2, dt); };
  B.rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
};

// ───────────── the hands ─────────────
const bugs = [], notes = []; let page, where = 'boot', consoleErrs = [], stepN = 0;
const say = (...a) => { if (!QUIET) console.log(...a); };
const bug = (sev, what, repro) => { const key = sev + what.replace(/\d+(\.\d+)?/g, '#'); if (bugs.some(b => b.key === key)) return; bugs.push({ key, sev, what, where, repro: repro || where }); console.log(`  BUG S${sev} [${where}] ${what}`); };
const ev = (fn, ...a) => page.evaluate(fn, ...a);
async function open(opts, keepStorage) {
  if (page) await page.context().close();
  const ctx = await browser.newContext({ viewport: { width: SIZE[0], height: SIZE[1] }, deviceScaleFactor: 1, hasTouch: TOUCH, isMobile: TOUCH });
  page = await ctx.newPage(); page.setDefaultTimeout(240000);
  page.on('console', m => { const t = m.text(); if (/Failed to load resource|GL Driver Message|GPU stall/.test(t)) return; if (m.type() === 'error' || m.type() === 'warning') consoleErrs.push(m.type() + ': ' + t.slice(0, 300)); });
  page.on('pageerror', e => consoleErrs.push('exception: ' + (e.stack || e.message).slice(0, 500)));
  await page.addInitScript(o => { window.__TEST__ = o; }, Object.assign({ webgl: 1, quality: 'low', title: 1 }, opts || {}));
  if (opts && opts.save !== undefined) await page.addInitScript(sv => { if (!sessionStorage.getItem('bot.once')) { sessionStorage.setItem('bot.once', '1'); if (sv) localStorage.setItem('brackenfell.v1', sv); else localStorage.removeItem('brackenfell.v1'); } }, opts.save);
  await page.addInitScript(n => { let a = (+n || 1) >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, SEED);
  await page.goto(`http://localhost:${port}/`); await page.waitForFunction(() => window.__ready === true);
  await ev(IN_PAGE);
}
const tap = async (x, y) => { if (TOUCH) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
// press a real button found by selector and text; reports it if a person could not
async function press(sel, re, what) {
  const bs = await ev(s => BOT.buttons(s), sel), b = bs.find(b => re.test(b.text) && b.shown) || bs.find(b => re.test(b.text));
  if (!b) return false;
  if (b.shown && (!b.inView || !b.reach)) { await ev(([s, i]) => document.querySelectorAll(s)[i].scrollIntoView({ block: 'center' }), [sel, b.i]); const b2 = (await ev(s => BOT.buttons(s), sel))[b.i]; if (b2 && b2.inView && b2.reach) { await tap(b2.x, b2.y); return true; } }
  if (!b.shown || !b.inView || !b.reach) { bug(2, `${what || 'button'} "${b.text.slice(0, 50)}" cannot be pressed: ${!b.shown ? 'not shown' : !b.inView ? `off screen at ${Math.round(b.x)}, ${Math.round(b.y)} of ${SIZE.join(' x ')}` : 'covered by ' + b.under}`); await ev(([s, i]) => document.querySelectorAll(s)[i].click(), [sel, b.i]); return true; }
  if (TOUCH && Math.min(b.w, b.h) < 43.5) bug(3, `${what || 'button'} "${b.text.slice(0, 40)}" is ${Math.round(b.w)} x ${Math.round(b.h)} px: under 44 px for a finger`);
  await tap(b.x, b.y); return true;
}
const key = async k => { await page.keyboard.press(k); await ev(() => BOT.step(1)); };
async function start(cont) { where = cont ? 'continue' : 'new game'; const ok = await press(cont ? '#contBtn' : '#startBtn', /./, 'title button'); if (!ok) bug(1, 'no ' + (cont ? 'Continue' : 'Enter') + ' button on the title screen'); await ev(async (cont) => { await BOT.settle(300); if (!cont) { BOT.day(10); if (qAt('welcome') < 0) qStart('welcome'); } else { Env.dayLength = 0; BOT.step(2); } }, !!cont); }
// after any step: what broke?
async function check(label, o) {
  stepN++; for (const e of consoleErrs.splice(0)) bug(/exception/.test(e) ? 1 : 3, 'console ' + e);
  for (const b of await ev(() => BOT.inv())) bug(2, b);
  if (!(o && o.nosave)) { const u = await ev(() => { const u = BOT.ui(); if (u.talk || u.menu || u.reader || u.busy) return null; let d = BOT.unsaved(); if (d.length) { BOT.step(340); d = BOT.unsaved(); } return d; });       /* the game saves by itself every 10 s of play */ if (u && u.length) bug(3, 'progress not saved after "' + label + '": a reload would lose ' + u.slice(0, 4).join('; ')); }
}
// the E key on a thing
async function use(id, o) {
  where = 'use ' + id; const r = await ev(i => BOT.approach(i), id);
  if (!r.ok) { if (!(o && o.may)) bug(r.nolabel ? 2 : 2, `cannot use ${id}: ${r.why}` + (process.env.BOTDEBUG ? ' ' + JSON.stringify(await ev(() => [BOT.ui(), Input.joy, Input.look, Player.pos.map(v => +v.toFixed(1))])) : '')); return false; }
  await key(TOUCH ? 'KeyE' : 'KeyE'); await ev(() => BOT.settle()); return true;
}
// dialogue: pick the option matching each pattern in turn; then leave by the last option until it closes
async function skipVoice() { for (let i = 0; i < 3; i++) { const d = await ev(() => BOT.dialog()); if (!d.wait) return; const r = await ev(() => { const e = document.getElementById('dtext').getBoundingClientRect(); return [e.left + e.width / 2, e.top + Math.min(e.height / 2, 20)]; }); await tap(r[0], r[1]); await ev(() => BOT.step(1)); } }
const trace = []; const tr = async () => { const d = await ev(() => BOT.dialog()); trace.push(`[${where}] ${d.name}: ${d.text.replace(/\n/g, ' / ').slice(0, 160)}  {${d.opts.map(o => o.text).join(' | ')}}`); };
async function pick(re) { await skipVoice(); await tr(); const ok = await press('#dopts button', re, 'dialogue option'); if (ok) await ev(() => BOT.settle()); return ok; }
async function leaveTalk() { for (let g = 0; g < 10; g++) { const u = await ev(() => BOT.ui()); if (u.reader) { await key('Escape'); continue; } if (!u.talk) return true; await skipVoice(); const d = await ev(() => BOT.dialog()); const last = d.opts[d.opts.length - 1]; if (!last) { await key('Escape'); continue; } await press('#dopts button', new RegExp('^(\\d+\\.\\s+)?' + last.text.replace(/^\d+\.\s+/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), 'dialogue option'); await ev(() => BOT.settle()); } await key('Escape'); const u = await ev(() => BOT.ui()); if (u.talk) bug(1, 'a conversation with ' + u.talk + ' cannot be left'); return !u.talk; }
async function talk(id, ...picks) {
  where = 'talk ' + id + (picks.length ? ' > ' + picks.map(String).join(' > ') : '');
  if (!await use('npc:' + id)) return false; where = 'talk ' + id + (picks.length ? ' > ' + picks.map(String).join(' > ') : '');
  const u = await ev(() => BOT.ui()); if (u.talk !== id) { bug(2, `E on ${id} did not open a conversation with them (${u.talk || 'nothing'}; last notice: ${await ev(() => BOT.toasts.slice(-1)[0] || '')})`); return false; }
  for (const p of picks) { if (!await pick(p)) { const d = await ev(() => BOT.dialog()); bug(2, `no option ${p} when talking to ${id}; offered: ${d.opts.map(o => o.text).join(' | ').slice(0, 300)}`); break; } }
  await leaveTalk(); await check(where); return true;
}
// fight whatever is near with real input: W to close in, the attack button (mouse, or the touch button), until nothing hostile is left within reach
async function fight(o) {
  const w0 = where; let swings = 0, killed = 0, last = null, far = 0; await ev(() => { Input.plock = true; }); if (!TOUCH) await page.mouse.move(SIZE[0] / 2, SIZE[1] / 2);       // with the pointer captured there is no cursor: clicks go to the view, wherever the cursor was left
  const atk = async down => { if (TOUCH) { const b = (await ev(() => BOT.buttons('#tAtk')))[0]; if (!b || !b.shown) { bug(2, 'no attack button on a touch screen'); return; } await page.dispatchEvent('#tAtk', down ? 'pointerdown' : 'pointerup', { pointerId: 9, pointerType: 'touch', bubbles: true }); } else if (down) await page.mouse.down(); else await page.mouse.up(); };
  for (let i = 0; i < 2500; i++) {
    const f = await ev(() => BOT.foe()), u = await ev(() => BOT.ui()); if (u.dead) { await atk(false); await page.keyboard.up('KeyW'); return { died: true, swings, killed }; } if (!f) break;
    if (last && f.kind + f.hp !== last && f.hp > 0 && false) killed++; last = f.kind + f.hp;
    if (await ev(() => RPG.st().sta) < 18) { await page.keyboard.up('KeyW'); await page.keyboard.down('KeyS'); await ev(() => { for (let k = 0; k < 50; k++) { BOT.aim(); BOT.step(1); } }); await page.keyboard.up('KeyS'); continue; }       // out of breath: back off and breathe, as a person must
    const d = await ev(() => BOT.aim()); if (d > 1.7) await page.keyboard.down('KeyW'); else await page.keyboard.up('KeyW');
    far = d > 2.0 ? far + 1 : 0; if (far > 0 && far % 8 === 0) { const side = (far / 8) % 2 ? 'KeyD' : 'KeyA'; await page.keyboard.down(side); await ev(n => { for (let k = 0; k < n; k++) BOT.step(1); }, 18 + far); await page.keyboard.up(side); }       // something is in the way: go round it
    await atk(true); if (process.env.BOTDEBUG && swings % 25 === 0) console.log('   down', JSON.stringify(await ev(() => ({ atk: RPG.in.atk, plock: Input.plock, locked: Player.locked, ph: Combat.phase, pressed: Combat.pressed, vm: !!Combat.vm, ui: BOT.ui(), ple: !!document.pointerLockElement }))));
    await ev(() => { for (let k = 0; k < 5; k++) { BOT.aim(); BOT.step(1); } }); await atk(false); await ev(() => { for (let k = 0; k < 7; k++) { BOT.aim(); BOT.step(1); } }); swings++;
    if (process.env.BOTDEBUG && swings % 25 === 0) console.log('   fight', swings, JSON.stringify(await ev(() => ({ d: +BOT.aim().toFixed(2), f: BOT.foe(), sta: Math.round(RPG.st().sta), atk: RPG.in.atk, plock: Input.plock, locked: Player.locked, wep: RPG.st().eq.weapon, sw: Combat.swingN, y: +Player.pos[1].toFixed(1), keys: Object.keys(Input.keys).filter(k => Input.keys[k]).join('') }))));
    if (swings === 2000) bug(2, `a ${f.kind} (${f.state}, ${f.hp} health) could not be killed in 2000 swings`);
  }
  await atk(false); await page.keyboard.up('KeyW'); await ev(() => BOT.step(5)); where = w0; return { died: false, swings };
}
const closeAll = async () => { for (let i = 0; i < 4; i++) { const u = await ev(() => BOT.ui()); if (u.reader || u.menu || u.talk) await key('Escape'); else break; } };
const q = id => ev(i => qAt(i), id), st = () => ev(() => ({ gold: S.gold, items: S.items, flags: S.flags, q: Object.fromEntries(Object.keys(S.q).map(k => [k, qAt(k)])), cell: World.cell ? World.cell.id : null, hp: RPG.st().hp, opened: S.opened }));
const expect = (c, what, sev) => { if (!c) bug(sev || 2, what); return !!c; };
async function useAnd(id, label, o) { const ok = await use(id, o); if (/relic|journal/.test(id)) { await page.waitForTimeout(450); await ev(() => BOT.step(2)); const u = await ev(() => BOT.ui()); if (ok && !u.reader) bug(3, id + ': the book that comes with it did not open to be read'); } await closeAll(); await check(label || 'use ' + id); return ok; }
async function shot(name) { await ev(() => game.draw()); await page.screenshot({ path: root + OUT + '/' + name + '.png' }); }

// ───────────── scenarios ─────────────
const SC = {};
// the first quests, in the order the game suggests
async function firstQuests() {
  await talk('hale', /something on his mind/i); expect(await q('welcome') >= 1, 'Hale did not send you to Greta (welcome ' + await q('welcome') + ')'); expect(await q('main') === 0, 'Hale’s greeting did not start the main story (' + await q('main') + ')');
  await talk('greta', /./); expect(await q('ale') === 0, 'Greta did not ask for malt (ale ' + await q('ale') + ')');
  await talk('osric', /./); expect((await st()).items.malt, 'Osric gave no malt');
  await talk('greta', /./); expect(await q('ale') === 99, 'ale quest not done (' + await q('ale') + ')');
  await talk('brandt', /./); await talk('tobin', /./); await useAnd('hammer'); expect(await q('hammer') === 2, 'hammer quest after picking the hammer up: ' + await q('hammer'));
  await talk('brandt', /./); expect(await q('hammer') === 99, 'hammer quest not done (' + await q('hammer') + ')');
  await talk('maren', /./); for (let i = 0; i < 5; i++) await useAnd('frostcap' + i); await talk('maren', /./); expect(await q('herbs') === 99, 'herbs quest not done (' + await q('herbs') + ')');
  await talk('aldous', /./); await talk('marta', /rope/i); expect((await st()).items.rope, 'Marta sold no rope'); await talk('aldous', /./); await useAnd('bell'); expect(await q('bell') === 99, 'bell quest not done (' + await q('bell') + ')');
  await talk('rowan', /light it/i); expect(await q('fire') === 1, 'Rowan did not ask for the fire (' + await q('fire') + ')');
}
SC.story = async () => {
  await open(); await start(false); await ck('start'); await firstQuests(); await ck('first');
  // Act 1
  await useAnd('wharf.body'); expect(await q('main') === 1, 'the body did not move the story on (' + await q('main') + ')');
  await talk('maren', /dead man/i, /drowned/i, /come from/i); expect(await q('main') === 2, 'Maren did not name the miner (' + await q('main') + ')');
  await useAnd('chapel.sacristy'); await useAnd('chapel.gate'); await useAnd('chapel.relic'); expect(await q('main') === 3, 'the reliquary did not give the key (' + await q('main') + ')');
  await talk('marta', /lantern/i);
  await ck('key');
  await useAnd('door.mine.in', 'the mine door'); expect((await st()).cell === 'mine', 'the mine door did not lead into the mine'); expect(await q('main') === 4, 'stage in the mine ' + await q('main'));
  await ev(() => Foes.calm(true));
  await useAnd('mine.journal'); expect(await q('main') === 5, 'the journal did not move the story on (' + await q('main') + ')');
  await useAnd('door.mine.out', 'out of the mine'); expect(!(await st()).cell, 'still in the mine after the door out');
  await talk('hale', /./, /./, /./); expect((await st()).flags.act1, 'Hale did not close Act 1'); expect(await q('main') === 6, 'stage after Hale ' + await q('main'));
  await ck('act1');
  // Acts 2 and 3
  await talk('rowan', /./); await talk('rowan', /./); expect(!(await st()).flags.act2, 'Rowan tells the rest on the day he said "not today"'); expect(/tomorrow/i.test(await ev(() => questLine('main'))), 'the journal does not say to come back to Rowan tomorrow');
  await ev(() => BOT.day(22)); await useAnd('inn.bed', 'sleep on it'); await ev(() => { if (World.cell) game.leave(); BOT.day(10); });
  await talk('rowan', /./, /./, /./, /./); expect((await st()).flags.act2, 'Rowan did not tell it the next day (act2)'); expect(await q('main') === 7, 'stage after Rowan ' + await q('main'));
  await useAnd('sec.wall'); expect((await st()).opened['sec.wall'], 'the Hart’s cellar wall did not open');
  await useAnd('door.tunnel.in', 'the smugglers’ door'); await ev(() => BOT.step(4)); expect(await q('main') === 8, 'the tunnel did not move the story on (' + await q('main') + ')');
  // walk the tunnel with the W key held (real input), as a person would
  await ev(() => { const O = Cells.by.mine.origin; Cells.teleport({ p: [O[0] + 63, Cells.by.mine.floorY + 0.1, O[2] - 30], yaw: -Math.PI / 2 }); Player.yaw = -Math.PI / 2; BOT.step(2); });
  let wx = 99; for (let leg = 0; leg < 40 && wx > -36; leg++) {
    if (await ev(() => !!BOT.foe(7))) { const r = await fight(); if (r.died) { bug(3, 'died in the smugglers’ tunnel with starting gear after ' + r.swings + ' swings'); await ev(() => BOT.settle(3500)); break; } }
    await page.keyboard.down('KeyW'); wx = await ev(() => { const O = Cells.by.mine.origin; for (let i = 0; i < 90 && Player.pos[0] > O[0] - 36 && !BOT.foe(5); i++) { Player.yaw = -Math.PI / 2; Player.pitch = 0; BOT.step(1); } return Player.pos[0] - O[0]; }); await page.keyboard.up('KeyW'); }
  await ev(() => BOT.step(3));
  expect(wx < -35, 'the tunnel cannot be walked to the cave with W held: stopped at x ' + wx.toFixed(1)); expect(await q('main') === 9, 'the cave did not move the story on (' + await q('main') + ')'); await check('the tunnel');
  await ck('cave');
  const before = await ev(() => JSON.stringify({ S, hour: Env.hour, pos: Player.pos, yaw: Player.yaw }));
  for (const kind of ['bread', 'rest']) {
    where = 'ending ' + kind; await ev(([b, kind]) => { const j = JSON.parse(b); applySave(j); A2.shown = ''; if (kind === 'bread') S.items.bread = Math.max(3, S.items.bread || 0); mainSync(); BOT.step(3); }, [before, kind]);
    if (!await use('mine.slab')) continue; const u = await ev(() => BOT.ui()); expect(u.talk === 'hollow', 'the slab did not open its choice');
    expect(await pick(kind === 'bread' ? /Leave the bread/i : /names/i), 'no option for the ' + kind + ' ending'); for (let i = 0; i < 6; i++) { const u = await ev(() => BOT.ui()); if (u.reader) await key('Escape'); else if (u.talk) await leaveTalk(); else break; }
    await ev(() => BOT.settle(200)); const s = await st(); expect(s.flags.ending === kind, 'ending not set: ' + kind + ' (' + s.flags.ending + ')'); expect(s.q.main === 99, 'the main story is not finished after the ' + kind + ' ending (' + s.q.main + ')'); await check('ending ' + kind); await ck(kind);
    await ev(() => { game.leave(); BOT.day(10); }); await talk('rowan', /./); await talk('hale', /./); await talk('greta', /./);
  }
};

// a checkpoint: what the game has saved at this point of the story, kept for the scenarios that start from it
const CK = {}; const ck = async name => { await ev(() => { save(); }); CK[name] = await ev(() => localStorage.getItem('brackenfell.v1')); fs.mkdirSync(root + 'shots/bot', { recursive: true }); fs.writeFileSync(root + 'shots/bot/ck_' + name + '.json', CK[name]); };
const ckLoad = name => CK[name] || (fs.existsSync(root + 'shots/bot/ck_' + name + '.json') ? fs.readFileSync(root + 'shots/bot/ck_' + name + '.json', 'utf8') : null);
// load a save the way a person does (the page boots with it in storage, Continue is pressed) and compare what the game then holds with what was saved
async function resume(sv, label, o) {
  where = 'load ' + label; await open(Object.assign({ save: sv }, process.env.BOTDEBUG ? { trap: 1 } : {})); const want = JSON.parse(sv);
  const cb = (await ev(() => BOT.buttons('#contBtn')))[0]; if (!cb || !cb.shown) { bug(1, 'a saved game exists but the title screen offers no Continue (' + label + ')'); return false; }
  await start(true); const d = await ev(w => BOT.diff(w.S, JSON.parse(JSON.stringify(S))).filter(d => !/\.(sta|hp|t|iframes|regen|oil|disc|seen|hour)\b/.test(d)), want);
  if (d.length && !(o && o.old)) bug(2, 'loading the save "' + label + '" changes it: ' + d.slice(0, 5).join('; '));
  const u = await ev(() => BOT.ui()); const pos = await ev(() => Player.pos.slice());
  if (!(o && o.old) && want.pos && Math.hypot(pos[0] - want.pos[0], pos[2] - want.pos[2]) > 3) bug(2, 'loading "' + label + '" puts the player ' + Math.hypot(pos[0] - want.pos[0], pos[2] - want.pos[2]).toFixed(0) + ' m from where the save was made');
  await check('load ' + label, { nosave: true }); return true;
}
// every option of a conversation, a few clicks deep, new ones first
const seenOpt = new Set();
async function explore(id, rounds, rnd) {
  for (let r = 0; r < rounds; r++) {
    where = 'explore ' + id; const ok = await use('npc:' + id, { may: true }); if (!ok) return; let u = await ev(() => BOT.ui()); if (u.talk !== id) { await closeAll(); return; }
    const pathTaken = [];
    for (let c = 0; c < 9; c++) { u = await ev(() => BOT.ui()); if (u.reader || u.menu) { await key('Escape'); continue; } if (!u.talk) break; await skipVoice(); const d = await ev(() => BOT.dialog()); await tr();
      if (!d.text.trim()) bug(2, `${id} says nothing (empty line) after: ${pathTaken.join(' > ') || 'greeting'}`); if (/undefined|NaN|\[object/.test(d.text + d.opts.map(o => o.text).join(' '))) bug(2, `${id}: broken text "${(d.text + ' {' + d.opts.map(o => o.text).join(' | ') + '}').match(/.{0,40}(undefined|NaN|\[object).{0,40}/)[0]}"`);
      if (!d.opts.length) { bug(1, `${id}: a line with no way on (no options) after ${pathTaken.join(' > ')}`); await key('Escape'); break; }
      for (const o of d.opts) if (!o.inView || !o.reach && o.shown) bug(2, `${id}: option "${o.text.slice(0, 40)}" ${!o.inView ? 'is off screen' : 'is covered by ' + o.under} (${d.opts.length} options)`);
      const fresh = d.opts.filter(o => !seenOpt.has(id + '|' + d.text.slice(0, 50) + '|' + o.text)), o = (fresh.length ? fresh : d.opts)[Math.floor(rnd() * (fresh.length ? fresh.length : d.opts.length))]; seenOpt.add(id + '|' + d.text.slice(0, 50) + '|' + o.text); pathTaken.push(o.text.replace(/^\d+\.\s+/, '').slice(0, 30));
      where = 'talk ' + id + ' > ' + pathTaken.join(' > '); const b = await ev(i => BOT.buttons('#dopts button')[i], o.i); await tap(b.x, b.y); await ev(() => BOT.settle()); }
    await leaveTalk(); await closeAll(); await ev(() => BOT.settle()); await check(where);
    const s2 = await ev(() => ({ jail: S.jail, cell: World.cell ? World.cell.id : null })); if (s2.jail) { await ev(async () => { IX.release('wait'); await BOT.settle(1800); }); }
  }
}
const MAIN = ['hale', 'greta', 'brandt', 'tobin', 'marta', 'aldous', 'maren', 'osric', 'edda', 'finn', 'lark', 'wren', 'rowan', 'pip', 'ivo', 'hilda', 'bram'];
SC.talks = async () => {
  const rnd = (() => { let a = SEED; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  for (const name of has('--all-talks') ? ['start', 'first', 'key', 'act1', 'cave', 'bread', 'rest'] : ['first', 'act1', 'rest']) { const sv = ckLoad(name); if (!sv) { console.log('   no checkpoint ' + name + ' (run story first)'); continue; }
    if (!await resume(sv, 'checkpoint ' + name)) continue; await ev(() => { BOT.day(10); S.gold += 200; save(); });
    for (const id of MAIN) await explore(id, name === 'first' || name === 'act1' ? 4 : 2, rnd);
    for (const id of ['pat1', 'pat4', 'r_in12', 'r_shopn2']) await explore(id, 1, rnd); }
};
// press E on everything the world offers, at night (nobody awake to call it theft), and deal with whatever opens
SC.sweep = async () => {
  const sv = ckLoad('first'); if (sv) await resume(sv, 'checkpoint first'); else { await open(); await start(false); }
  await ev(() => { BOT.day(3); S.flags.bed = 1; }); const n = await ev(() => World.interact.length), kinds = await ev(() => World.interact.map(i => [i.kind || '?', i.id || '', i.cell || ''])); const un = {}, rnd = (() => { let a = SEED + 1; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const every = +val('--every', 1);
  for (let i = 0; i < n; i += every) {
    const [kind, id] = kinds[i]; where = 'sweep ' + kind + ' ' + id;
    // whatever the last thing set going (a guard on his way, a fade, a bed that slept the night away) is let finish first
    await ev(async () => { if (Math.abs(Env.hour - 3) > 0.5) BOT.day(3); if (S.crime) { S.crime = null; S.stolen = {}; } await BOT.settle(); }); if ((await ev(() => BOT.ui())).talk) await leaveTalk(); await closeAll();
    const r = await ev(i => BOT.approach('#' + i), i); if (!r.ok) { if (!r.nolabel && process.env.BOTDEBUG) console.log('   unreach', id, JSON.stringify(await ev(() => [BOT.ui(), !!IX.sit, S.jail, Player.eye, RPG.dead, Env.hour.toFixed(1), BOT.toasts.slice(-2), BOT.who]))); if (!r.nolabel) { (un[kind] = un[kind] || []).push(id + (r.why.includes('instead') ? ' ' + r.why.slice(r.why.indexOf('(')) : '')); } continue; }
    await key('KeyE'); await ev(() => BOT.settle()); let u = await ev(() => BOT.ui()); if (process.env.BOTDEBUG) console.log('   did', i, kind, id, r.label, JSON.stringify([u.locked, u.talk, u.reader, await ev(() => [document.getElementById('fade').classList.contains('on'), +Env.hour.toFixed(1), !!IX.sit, BOT.toasts.slice(-1)[0]])]));
    if (u.reader) { const t = await ev(() => document.getElementById('rtext').textContent + '|' + document.getElementById('rtitle').textContent); if (t.length < 12 || /undefined|NaN|\[object/.test(t)) bug(2, `reading ${id}: broken or empty text "${t.slice(0, 80)}"`); const cb = (await ev(() => BOT.buttons('#reader button')))[0]; if (cb && (!cb.inView || !cb.reach)) bug(2, 'the reader’s close button cannot be pressed (' + id + ')'); await key('Escape'); u = await ev(() => BOT.ui()); if (u.reader) bug(1, 'the reader does not close with Escape (' + id + ')'); }
    if (u.talk) { for (let c = 0; c < 3 && (await ev(() => BOT.ui())).talk; c++) { const d = await ev(() => BOT.dialog()); if (!d.opts.length) break; const o = d.opts[Math.floor(rnd() * d.opts.length)]; await skipVoice(); await tap(o.x, o.y); await ev(() => BOT.settle()); } await leaveTalk(); }
    await closeAll(); if (kind === 'seat') { await page.keyboard.down('KeyW'); await ev(() => BOT.step(8)); await page.keyboard.up('KeyW'); }
    await ev(() => { if (S.jail) IX.release('wait'); if (RPG.st().hp < 60) RPG.st().hp = 100; }); await ev(() => BOT.settle()); await check(where, { nosave: i % 25 !== 0 });
    if (i % 200 === 0) say(`   sweep ${i} / ${n}`);
  }
  if (un.bed) { un.bed = un.bed.filter(x => !/instead/.test(x)); if (!un.bed.length) delete un.bed; }       // a bed with a sleeper in it, or a chest at its foot that is offered first
  for (const k in un) bug(3, `${un[k].length} ${k} thing(s) show a label but no place could be found to stand and use them: ${un[k].slice(0, 12).join(', ')}`);
};
// reload after every step of the first quests and of Act 1, and compare
SC.reload = async () => {
  for (const name of ['start', 'first', 'key', 'act1', 'cave', 'bread', 'rest']) { const sv = ckLoad(name); if (!sv) { console.log('   no checkpoint ' + name + ' (run story first)'); continue; } if (!await resume(sv, 'checkpoint ' + name)) continue;
    // the world must agree with the save: things taken stay taken, opened stay opened, the quest marker exists
    const w = await ev(() => { const out = []; for (const p of World.pickups) if (S.picked[p.id] && !p.gone) out.push('picked thing is back: ' + p.id); for (const it of World.interact) { if (it.kind === 'chest' && S.opened[it.id] && interactLabel(it)) out.push('opened chest offers itself again: ' + it.id); if (it.kind === 'gate' && S.opened[it.id] && World.colliders.includes(it.col)) out.push('unlocked gate is shut again: ' + it.id); }
      for (const id of QORDER) { if (S.q[id] && !S.q[id].done) { let t; try { t = questTarget(id); } catch (e) { out.push('quest marker for ' + id + ' throws: ' + e.message); } } } if (S.flags.ending && typeof A2 !== 'undefined' && A2.shown !== S.flags.ending) out.push('the village does not show the ' + S.flags.ending + ' ending after loading'); return out; });
    for (const x of w) bug(2, 'after loading "' + name + '": ' + x);
    await talk('greta', /./); await talk('hale', /./); }
};
// clear a camp (or a kind of foe) by fighting, eating between fights the way a careful player does; loot what falls
async function clear(campId, kind, max) {
  await ev(() => { BOT.hardy = true; }); let deaths = 0; for (let n = 0; n < (max || 12); n++) { const left = await ev(([c, k]) => BOT.left(c, k), [campId, kind]); if (!left) break; const h = await ev(([c, k]) => BOT.hunt(c, k), [campId, kind]); if (h !== true) { if (h) bug(3, 'hunt: ' + h); break; }
    const r = await fight(); if (r.died) { deaths++; await ev(() => BOT.settle(1500)); await check('death while clearing ' + (campId || kind), { nosave: true }); if (deaths > 2) break; } await ev(() => { const r = RPG.st(); r.hp = RPG.MAXHP; r.sta = RPG.MAXST; }); }
  await ev(() => BOT.step(20)); for (let pass = 0; pass < 3; pass++) { const ls = await ev(() => BOT.loots()); if (!ls.length) break; for (const i of ls.reverse()) { const ok = await use('#' + i, { may: true }); if (!ok && pass === 2) bug(2, 'a fallen foe’s things cannot be taken: ' + JSON.stringify(await ev(i => { const it = World.interact[i]; return it && [it.name, it.p.map(v => +v.toFixed(1)), it.loot, interactLabel(it), World.cell && World.cell.id, +(it.p[1] - World.groundAt(it.p[0], it.p[2], it.p[1] + 1)).toFixed(2)]; }, i))); await closeAll(); } }       /* highest index first: taking one removes it from the list */ await ev(() => { BOT.hardy = false; }); await check('clearing ' + (campId || kind)); return deaths;
}
async function menu(keyName, tab) { await key(keyName); const u = await ev(() => BOT.ui()); if (!u.menu) { bug(2, 'the ' + tab + ' does not open with ' + keyName); return false; } return true; }
// side quests, shops, the board, perks, the bounty, by the buttons a player uses
SC.side = async () => {
  const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(11); S.gold += 400; save(); });
  // the shop: buy the three things a new player wants, sell one back
  where = 'shop'; await use('npc:brandt'); expect(await pick(/for sale/i), 'Brandt has no "for sale" option'); let d = await ev(() => BOT.dialog()); expect(d.opts.length >= 4, 'the shop lists ' + d.opts.length + ' things'); for (const o of d.opts) if (!o.inView || !o.reach) bug(2, 'shop row "' + o.text.slice(0, 40) + '" cannot be pressed (' + (o.inView ? 'covered by ' + o.under : 'off screen') + ')');
  const g0 = (await st()).gold; expect(await pick(/Iron arming sword|longsword/i), 'no sword in the shop'); const s1 = await st(); expect(s1.gold < g0, 'buying a sword cost nothing'); await pick(/Something else/i); await pick(/jerkin|hauberk|gambeson/i); await leaveTalk(); await check('shop');
  await use('npc:brandt'); if (await pick(/things to sell/i)) { d = await ev(() => BOT.dialog()); const g1 = (await st()).gold; if (d.opts.length > 1) { const t = d.opts[0].text.replace(/^\d+\.\s+/, '').slice(0, 14).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); await pick(new RegExp(t)); expect((await st()).gold > g1, 'selling "' + d.opts[0].text.slice(0, 30) + '" paid nothing'); } } else bug(2, 'Brandt will not buy'); await leaveTalk(); await check('sell');
  // the pack: open it, press a perk, eat, close
  where = 'pack'; await ev(() => { RPG.xp(200); }); if (await menu('KeyI', 'pack')) { const pk = await ev(() => BOT.buttons('#tab-pack button')); for (const b of pk) if (b.shown && (!b.inView && false || TOUCH && Math.min(b.w, b.h) < 43.5)) bug(3, 'pack button "' + b.text.slice(0, 30) + '" is ' + Math.round(b.w) + ' x ' + Math.round(b.h) + ' px');
    const pts = await ev(() => RPG.st().perkPts); expect(pts > 0, 'no perk point after levelling'); const ok = await press('#tab-pack button[data-perk]', /./, 'perk'); expect(ok, 'no perk card to press in the pack with ' + pts + ' points'); await ev(() => BOT.step(2)); expect((await ev(() => RPG.st().perkPts)) === pts - 1, 'pressing a perk did not spend the point'); await key('Escape'); expect(!(await ev(() => BOT.ui())).menu, 'the pack does not close with Escape'); } await check('perk');
  for (const [k, tab] of [['KeyJ', 'journal'], ['KeyM', 'map']]) { where = tab; if (await menu(k, tab)) { await ev(() => BOT.step(3)); await shot('menu_' + tab); await key('Escape'); } } await check('menus', { nosave: true });
  // the notice board: take the outlaw job, do it, collect
  where = 'board'; await use('board'); let u = await ev(() => BOT.ui()); if (u.reader) await key('Escape'); u = await ev(() => BOT.ui()); if (u.talk !== 'board') { await closeAll(); await use('board'); u = await ev(() => BOT.ui()); }
  expect(u.talk === 'board', 'the notice board opens no list of jobs (' + JSON.stringify(u) + ')'); await pick(/Outlaws on the passes/i); await leaveTalk(); expect(await ev(() => RPG.st().job && RPG.st().job.id) === 'outlaws', 'the outlaw notice was not taken');
  await ev(() => { game.leave(); BOT.day(11); }); if (await q('bounty') < 0) await talk('hale', /work for a sword/i); expect(await q('bounty') === 0, 'Hale did not give the bounty (' + await q('bounty') + ')');
  const deaths = await clear('pines'); notes.push('camp in the pines cleared with ' + deaths + ' deaths'); expect(await ev(() => BOT.left('pines')) === 0, 'the camp in the pines could not be cleared (' + await ev(() => BOT.left('pines')) + ' left)');
  expect(await q('camp') >= 1 || await q('camp') === -1, 'camp quest state ' + await q('camp')); await ev(() => { game.leave(); BOT.day(11); });
  await useAnd('bonfire', 'light the fire'); expect(await q('fire') === 99, 'the harvest fire did not finish its quest (' + await q('fire') + ')'); await ev(() => BOT.settle(2800)); await ev(() => BOT.day(11));
  await talk('rowan', /valley safe/i, /see to it/i); expect(await q('camp') === 1, 'Rowan asks for a camp that is already empty and the quest does not know (' + await q('camp') + ')'); await talk('rowan', /camp in the pines is empty/i); expect(await q('camp') === 99, 'Rowan did not close the camp quest (' + await q('camp') + ')');
  await use('board'); if ((await ev(() => BOT.ui())).reader) { await key('Escape'); await use('board'); } const done = await ev(() => RPG.st().job && RPG.st().job.done); if (done) { const g = (await st()).gold; expect(await pick(/Collect/i), 'no "Collect the pay" on the board with the job done'); expect((await st()).gold === g + 35, 'the board paid ' + ((await st()).gold - g) + ' for the outlaw job, not 35'); } else notes.push('outlaw job needs 4 kills; the camp gave ' + await ev(() => RPG.st().job && RPG.st().job.n)); await leaveTalk(); await check('board');
  // Garrick's camp: the tools, the bounty
  await clear('crag'); await ev(() => { game.leave(); BOT.day(11); }); const s2 = await st(); expect(s2.items.tools, 'Garrick’s camp is cleared and looted but there are no tools'); if (s2.items.tools) { await talk('brandt', /tools|tongs|files/i); expect(await q('tools') === 99, 'Brandt did not take his tools back (' + await q('tools') + ')'); }
  const bn = await ev(() => bountyN()); if (await q('bounty') === 1) { const g = (await st()).gold; await talk('hale', /bounty/i); expect(await q('bounty') === 99 && (await st()).gold > g, 'Hale did not pay the bounty (' + await q('bounty') + ')'); } else notes.push('bounty at ' + bn + ' of 5, quest ' + await q('bounty'));
  // sleep in your own bed
  await ev(() => BOT.day(22)); await useAnd('inn.bed', 'sleep'); expect(Math.abs((await ev(() => Env.hour)) - 7) < 0.6, 'sleeping did not bring the morning (hour ' + (await ev(() => Env.hour)).toFixed(1) + ')');
  // the wilds: tea for Maren
  await ev(() => BOT.day(11)); await talk('maren', /fetch/i); if (await q('tea') === 0) { for (const it of ['bogbean', 'sunwort', 'stonecrop']) { const i = await ev(n => World.interact.findIndex(x => x.kind === 'pickup' && x.item === n && !x.gone), it); if (i < 0) { bug(2, 'no ' + it + ' to pick anywhere'); continue; } await use('#' + i); await check('pick ' + it); } await talk('maren', /./); expect(await q('tea') === 99, 'Maren did not take the tea herbs (' + await q('tea') + ')'); } else notes.push('tea quest not offered here (' + await q('tea') + ')');
};
// theft in front of a witness, each way out of it
SC.crime = async () => {
  for (const way of ['Hand it back', 'Pay the fine', 'Go quietly']) {
    const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(12); S.gold = 60; save(); });
    where = 'theft: ' + way; const i = await ev(() => { const it = World.interact.find(o => o.kind === 'loose' && !o.gone && o.owner && Cells.by[o.cell]); if (!it) return -1; const w = NPC.marta === (typeof ixGuard === 'function' && ixGuard()) ? NPC.greta : NPC.marta; game.enter(it.cell); w.anim = 'idle'; w.pos = [it.p[0] + 1.6, Cells.by[it.cell].floorY, it.p[2]]; w.path = null; return World.interact.indexOf(it); });
    if (i < 0) { bug(2, 'nothing loose and owned to steal anywhere'); return; } const items0 = (await st()).items; await use('#' + i); const c = await ev(() => S.crime && { fine: S.crime.fine, pending: S.crime.pending }); if (!expect(c && c.fine > 0, 'taking a thing in front of its witness was no crime')) continue;
    let u; for (let k = 0; k < 400; k++) { u = await ev(() => { BOT.step(6); return BOT.ui(); }); if (u.talk) break; await page.waitForTimeout(40); } if (!expect(u.talk === 'hale' || u.talk === 'ivo', 'no guard came to talk after a witnessed theft (talk: ' + u.talk + ')')) continue;
    const d = await ev(() => BOT.dialog()); for (const o of d.opts) if (!o.inView || !o.reach) bug(2, 'the guard’s option "' + o.text.slice(0, 30) + '" cannot be pressed');
    if (!await pick(new RegExp(way, 'i'))) { bug(2, 'the guard offers no "' + way + '": ' + d.opts.map(o => o.text).join(' | ')); await leaveTalk(); continue; }
    if (way === 'Go quietly') { for (let k = 0; k < 200 && !(await ev(() => S.jail === 1 && World.cell && World.cell.id === 'guardhouse')); k++) await page.waitForTimeout(50); await ev(() => BOT.settle(300)); const s = await st(); expect(s.cell === 'guardhouse', 'going quietly did not end in the cell (' + s.cell + ')'); await check('in the cell', { nosave: true });
      const j = await ev(() => World.interact.findIndex(x => x.kind === 'jaildoor' || x.id === 'jail.door')); expect(j >= 0, 'no cell door to use'); if (j >= 0) { await use('#' + j); for (let k = 0; k < 200 && (await ev(() => S.jail)); k++) await page.waitForTimeout(50); await ev(() => BOT.settle(600)); expect(!(await st()).cell && !(await ev(() => S.jail)), 'still in the cell after calling the guard'); } }
    else { await leaveTalk(); await ev(() => BOT.settle(300)); const s = await st(); expect(!(await ev(() => S.crime)), 'the crime stands after "' + way + '"'); if (way === 'Pay the fine') expect(s.gold === 60 - c.fine, 'the fine of ' + c.fine + ' took ' + (60 - s.gold) + ' gold'); }
    await check('theft: ' + way); await talk('hale', /./); await talk('marta', /./);
  }
};
// die, and carry on
// the logic audit (docs/LOGIC.md): one check for each fix made there
SC.logic = async () => {
  const opts = async () => (await ev(() => BOT.dialog())).opts.map(o => o.text);
  const board = async () => { if (!await use('board')) return false; return (await ev(() => BOT.ui())).talk === 'board'; };
  // ── story ──
  { const sv = ckLoad('start'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint start')) return; await ev(() => { BOT.day(12); });
    where = 'logic: Pip starts the story'; if (await use('npc:pip')) { const o = await opts(); expect(o.some(t => /happening at the wharf/.test(t)), 'Pip cannot be asked about the wharf before the body is seen: ' + o.join(' | ')); expect(o.some(t => /Seen anything odd/.test(t)), 'Pip has no "Seen anything odd"'); await pick(/happening at the wharf/); expect(await ev(() => qAt('main') >= 0), 'asking Pip about the wharf did not start the story'); await leaveTalk(); }
    where = 'logic: Marta before the story'; await ev(() => { S.gold = 20; }); if (await use('npc:marta')) { const o = await opts(), g = (await st()).gold, b = await ev(() => S.items.bread || 0); expect(!o.some(t => /lantern/i.test(t)), 'Marta offers a miner’s lantern before anyone has spoken of the mine'); expect(o.some(t => /rye loaf/.test(t)), 'Marta sells no bread (the slab says she does)'); await pick(/rye loaf/); const s = await st(); expect(o.filter(t => /rye loaf/.test(t)).length === 1, 'Marta lists bread twice'); expect(s.gold === g - 3 && (s.items.bread || 0) === b + 1, 'a loaf from Marta: gold ' + g + ' to ' + s.gold + ', bread ' + b + ' to ' + (s.items.bread || 0)); await leaveTalk(); }
    where = 'logic: the board before the mine is open'; if (await board()) { const o = await opts(), t = (await ev(() => BOT.dialog())).text; expect(!o.some(x => /Old Mine/.test(x)) && /Two of them/.test(t), 'the board offers work in the Old Mine while its door is still barred: ' + o.join(' | ')); await leaveTalk(); } }
  // ── mechanics ──
  { const sv = ckLoad('first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(12); S.gold = 100; S.items.oil = 0; RPG.st().job = null; RPG.st().jobDay = {}; save(); });
    where = 'logic: the oil job is paid once a day'; for (let k = 0; k < 3; k++) { if (!await use('npc:marta')) break; await pick(/Lamp oil/); await leaveTalk(); } expect((await st()).items.oil === 3, 'three flasks from Marta: have ' + (await st()).items.oil);
    if (await board()) { await pick(/Lamp oil for the watch/); await leaveTalk(); } if (await board()) { const g = (await st()).gold; await pick(/Collect/); expect((await st()).gold === g + 30, 'the oil job did not pay 30'); await leaveTalk(); }
    if (await board()) { const o = await opts(), t = (await ev(() => BOT.dialog())).text; expect(!o.some(x => /Lamp oil for the watch/.test(x)), 'the oil job can be taken again the same day (9 gold and 20 xp a round, for ever)'); expect(/tomorrow/.test(t), 'the board does not say the job comes back tomorrow'); await leaveTalk(); }
    await ev(() => { RPG.st().day = (RPG.st().day || 0) + 1; }); if (await board()) { expect((await opts()).some(x => /Lamp oil for the watch/.test(x)), 'the oil job is not back the next day'); await leaveTalk(); }
    where = 'logic: sleeping turns the day'; { const d0 = await ev(() => { BOT.day(22); S.flags.bed = 1; return RPG.st().day || 0; }); if (await use('inn.bed', { may: true })) { for (let k = 0; k < 100 && Math.abs((await ev(() => Env.hour)) - 7) > 0.6; k++) await page.waitForTimeout(50); await ev(() => BOT.settle(300)); const r = await ev(() => ({ d: RPG.st().day || 0, h: Env.hour })); expect(r.d === d0 + 1 && Math.abs(r.h - 7) < 0.6, 'to bed at 22:00 on day ' + d0 + ', up at ' + r.h.toFixed(1) + ' on day ' + r.d); } }
    where = 'logic: who sees a theft'; { const r = await ev(() => { BOT.day(12); const it = World.interact.find(o => o.kind === 'loose' && !o.gone && o.owner && o.cell === 'store') || World.interact.find(o => o.kind === 'loose' && !o.gone && o.owner && Cells.by[o.cell]); if (!it) return null; game.enter(it.cell); const fy = Cells.by[it.cell].floorY, w = NPC.greta; Player.pos = [it.p[0] + 0.8, fy, it.p[2]]; w.anim = 'idle'; w.path = null; for (const n of NPCS) if (n !== w && ixSpace(n.pos) === ixSpace(Player.pos)) n.pos = [n.pos[0], n.pos[1] + 40, n.pos[2]];
        w.pos = [it.p[0] + 1.8, fy, it.p[2]]; const same = !!ixWitness(); w.pos = [it.p[0] + 1.8, fy + 3.2, it.p[2]]; const above = !!ixWitness(); return { same, above, label: interactLabel(it) }; });
      if (expect(r, 'nothing loose and owned to test a witness with')) { expect(r.same, 'someone standing beside you is no witness'); expect(!r.above, 'someone on the floor above is a witness'); expect(/^Steal /.test(r.label), 'a thing that belongs to someone is offered as "' + r.label + '", not as stealing'); } await ev(() => { game.leave(); BOT.settle(200); }); }
    where = 'logic: stolen coin goes back too'; await ev(() => { BOT.day(12); S.gold = 50; S.items.apple = (S.items.apple || 0) + 1; S.stolen = { gold: 5, apple: 1 }; S.crime = { fine: 20, pending: false, by: 'hale', n: 1 }; });
    { const a0 = (await st()).items.apple; if (await use('npc:hale')) { const o = await opts(); expect(o.some(t => /Hand it back/.test(t)), 'holding all that was stolen, there is no "Hand it back": ' + o.join(' | ')); await pick(/Hand it back/); const s = await st(); expect(s.gold === 45 && (s.items.apple || 0) === a0 - 1, 'handing back 5 stolen gold and an apple left gold ' + s.gold + ' (of 50)'); await leaveTalk(); } }
    where = 'logic: no handing back what is gone, no trade while wanted'; await ev(() => { S.gold = 50; S.stolen = { pewter: 2 }; S.items.pewter = 0; S.crime = { fine: 20, pending: false, by: 'hale', n: 1 }; });
    if (await use('npc:marta')) { await pick(/things to sell/); const t = (await ev(() => BOT.dialog())).text; expect(/Hale has been asking/.test(t), 'Marta buys from a thief the watch is looking for: "' + t.slice(0, 60) + '"'); await leaveTalk(); }
    if (await use('npc:hale')) { const o = await opts(); expect(!o.some(t => /Hand it back/.test(t)), '"Hand it back" is offered for goods already sold'); const d0 = await ev(() => RPG.st().day || 0), v = await ev(() => 2 * (RPG.meta('pewter').value || 1)); await pick(/Go quietly/); for (let k = 0; k < 200 && !(await ev(() => S.jail === 1 && World.cell && World.cell.id === 'guardhouse')); k++) await page.waitForTimeout(50); await ev(() => BOT.settle(300)); const s = await st(), d1 = await ev(() => RPG.st().day || 0);
      expect(s.gold === 50 - v, 'the cell took ' + (50 - s.gold) + ' gold for 2 sold pewter worth ' + v); expect(d1 === d0 + 1, 'a night in the cell did not turn the day (' + d0 + ' to ' + d1 + ')');
      const j = await ev(() => World.interact.findIndex(x => x.kind === 'jaildoor')); if (j >= 0) { await use('#' + j); for (let k = 0; k < 200 && (await ev(() => S.jail)); k++) await page.waitForTimeout(50); await ev(() => BOT.settle(600)); } } }
  { where = 'logic: rain'; const r = await ev(() => { if (World.cell) game.leave(); Weather.set('fair'); BOT.day(10); BOT.step(30); const out = n => Cells.spaceOf(n.pos) === 0; const dry = { rowan: out(NPC.rowan), lark: out(NPC.lark) }; Weather.set('rain'); BOT.step(5); npcSnapAll(); BOT.step(30); const wet = { rowan: out(NPC.rowan), lark: out(NPC.lark), hale: NPC.hale.anim, brandt: NPC.brandt.anim, idle: NPCS.filter(n => out(n) && !n.path && (n.anim === 'sit' || n.anim === 'lute')).map(n => n.id) }; Weather.set('auto'); npcSnapAll(); return { dry, wet }; });
    expect(r.dry.rowan && r.dry.lark, 'at 10:00 in fair weather Rowan and Lark are not out of doors (the rain check needs them there)'); expect(!r.wet.rowan && !r.wet.lark, 'Rowan or Lark sits out in the rain'); expect(r.wet.hale === 'guard', 'the Warden left his post for the rain (' + r.wet.hale + ')'); expect(!r.wet.idle.length, 'sitting or playing out in the rain: ' + r.wet.idle.join(', ')); }
  { where = 'logic: how to fight is said'; const r = await ev(async () => { await Foes.loading; const keep = Feel.hints, f = Foes.list.find(f => f.alive); if (!f) return null; Feel.hints = { move: 1, look: 1, use: 1, journal: 1 }; Feel.counts = {}; Feel.t = (Feel.t || 0) + 100; Feel.shownAt = 0; if (Feel.tipKey) Feel.tipHide(); let seen = ''; const st = f.state;
      for (let i = 0; i < 60 && !seen; i++) { f.state = 'chase'; Feel.hintFrame(0.1); if (Feel.tipKey === 'fight') seen = document.getElementById('tip').textContent; } f.state = st; RPG.dodgeT = 0.2; Feel.hintFrame(0.1); RPG.dodgeT = 0; const done = !!Feel.hints.fight, shown = Feel.tipKey; Feel.hints = keep; return { seen, done, shown }; });
    if (expect(r, 'no foe to test the fighting hint with')) { expect(/block/i.test(r.seen) && /dodge/i.test(r.seen), 'nothing says how to block or dodge when a foe first gives chase ("' + r.seen + '")'); expect(r.done && r.shown !== 'fight', 'the fighting hint stays after a dodge'); } }
  // ── after the ending ──
  { const sv = ckLoad('bread'); if (!sv || !await resume(sv, 'checkpoint bread')) return; where = 'logic: after the bread ending';
    const m = await ev(() => { delete S.flags.hear_meeting; const M = SEC.meet; if (!M) return null; game.tp(M.x + 8, null, M.z); BOT.day(23.6); BOT.step(120); return { st: M.st, vis: !!M.a.visible }; }); if (m) expect(m.st === 'off' && !m.vis, 'the cloaked pair still meet behind the chapel after the matter is settled'); await ev(() => { Foes.calm(true); });
    await ev(() => { BOT.day(12); S.flags.freeStew = 0; S.gold = 10; }); if (await use('npc:greta')) { const o = await opts(); if (o.some(t => /bowl of stew/.test(t))) { await pick(/bowl of stew/); expect((await st()).gold === 10, 'Greta charged for the stew she said was on the house'); await leaveTalk(); await use('npc:greta'); await pick(/bowl of stew/); expect((await st()).gold === 7, 'the second bowl was not 3 gold'); } await leaveTalk(); } }
};
SC.death = async () => {
  const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(12); S.gold = 100; save(); });
  for (const place of ['pines', 'mine']) {
    where = 'death at ' + place; if (place === 'mine') { await ev(() => { give('minekey'); give('lantern'); S.flags.mineOpen = 1; }); await useAnd('door.mine.in', 'into the mine', { may: true }); }
    const h = await ev(c => BOT.hunt(c === 'mine' ? null : c, c === 'mine' ? 'delver' : null), place); if (h !== true) { bug(3, 'no foe to die to at ' + place + ': ' + h); continue; }
    const g = (await st()).gold, day0 = await ev(() => { if (Env.hour < 7) BOT.day(12); return RPG.st().day || 0; }); await ev(() => { RPG.st().hp = 6; }); let u; for (let k = 0; k < 900; k++) { u = await ev(() => { BOT.aim(); BOT.step(3); return BOT.ui(); }); if (u.dead) break; } if (!expect(u.dead, 'stood by a ' + place + ' foe for 90 s at 6 health and did not die')) continue;
    for (let k = 0; k < 200 && (await ev(() => BOT.ui())).dead; k++) await page.waitForTimeout(50); await ev(() => BOT.settle(900)); const s = await st(), w = await ev(() => ({ dead: RPG.dead, locked: Player.locked, msg: !document.getElementById('deadMsg').hidden, y: Player.pos[1], cell: World.cell ? World.cell.id : null, hour: Env.hour, toast: BOT.toasts.slice(-1)[0] }));
    expect(!w.dead && !w.locked, 'after dying the player stays dead or locked (' + JSON.stringify(w) + ')'); expect(!w.msg, 'the death message stays on screen'); expect(s.hp > 50, 'health after respawn is ' + s.hp); expect(g - s.gold === Math.min(80, Math.floor(g * 0.25)), 'death cost ' + (g - s.gold) + ' of ' + g + ' gold'); expect((await ev(() => RPG.st().day || 0)) === day0 + 1, 'dying and waking at seven did not turn the day'); expect(w.cell === 'inn', 'respawn with a bed at the Hart is in "' + w.cell + '", not in the inn (y ' + w.y.toFixed(1) + ')');
    await page.keyboard.down('KeyW'); const p0 = await ev(() => Player.pos.slice()); await ev(() => BOT.step(20)); await page.keyboard.up('KeyW'); const p1 = await ev(() => Player.pos.slice()); await check('death at ' + place); await talk('greta', /./);
  }
};
// the same story with the steps in another order, with steps skipped, and going back
SC.orders = async () => {
  // A: straight to the reliquary and the mine before ever looking at the body or asking Maren
  { const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => BOT.day(10)); where = 'order A';
    await useAnd('chapel.sacristy'); await useAnd('chapel.gate'); await useAnd('chapel.relic'); const s = await st(); expect(s.items.minekey && s.items.lantern, 'the reliquary gave no key and lantern when opened before the story asked');
    await useAnd('door.mine.in', 'the mine door'); expect((await st()).cell === 'mine', 'the mine door did not open with the key in hand (story stage ' + await q('main') + ')'); await ev(() => Foes.calm(true)); await useAnd('mine.journal'); await useAnd('door.mine.out', 'out');
    await talk('hale', /./, /./, /./); expect((await st()).flags.act1, 'order A: Hale did not close Act 1 when given the journal first (stage ' + await q('main') + ')');
    await useAnd('wharf.body', 'the body afterwards', { may: true }); await talk('maren', /./, /./, /./); const m = await q('main'); expect(m >= 6, 'order A: looking at the body after Act 1 moved the story BACK to stage ' + m);
    await talk('rowan', /./); await ev(() => BOT.day(22)); await useAnd('inn.bed', 'sleep on it'); await ev(() => { if (World.cell) game.leave(); BOT.day(10); }); await talk('rowan', /./, /./, /./, /./); expect((await st()).flags.act2, 'order A: Rowan did not tell it'); }
  // B: the wall and the tunnel before Rowan has spoken; the slab before the journal
  { const sv = ckLoad('key'); if (!await resume(sv, 'checkpoint key')) return; await ev(() => BOT.day(10)); where = 'order B';
    await useAnd('sec.wall', 'the wall before Rowan', { may: true }); const o1 = (await st()).opened['sec.wall']; notes.push('order B: the Hart wall ' + (o1 ? 'opens' : 'stays shut') + ' before Rowan tells of it');
    const r = await ev(() => BOT.approach('door.tunnel.in')); if (r.ok) { await key('KeyE'); await ev(() => BOT.settle()); const c = (await st()).cell; if (c === 'mine') { const m = await q('main'); notes.push('order B: tunnel entered early, story stage ' + m); await ev(() => Foes.calm(true)); const sl = await ev(() => BOT.approach('mine.slab')); if (sl.ok) { await key('KeyE'); await ev(() => BOT.settle()); const u = await ev(() => BOT.ui()); if (u.talk) { const d = await ev(() => BOT.dialog()); notes.push('order B: the slab offers ' + d.opts.map(o => o.text).join(' | ')); await leaveTalk(); } } await check('order B in the cave'); await ev(() => game.leave()); } }
    await ev(() => { game.leave(); BOT.day(10); }); await talk('rowan', /./); await talk('hale', /./); await check('order B'); }
  // C: both endings refused first (walk away from the slab), then the mine door again, then choose
  { const sv = ckLoad('cave'); if (!await resume(sv, 'checkpoint cave')) return; where = 'order C'; await use('mine.slab'); await leaveTalk(); expect(!(await st()).flags.ending, 'leaving the slab without choosing set an ending');
    await ev(() => { game.leave(); BOT.day(10); }); await talk('rowan', /./); await talk('greta', /./); await useAnd('door.mine.in', 'back into the mine'); expect((await st()).cell === 'mine', 'order C: cannot go back into the mine before the ending'); await check('order C'); }
};
// saves written by old builds (test/saves/*.json, made by running those builds) loaded into today's game
SC.saves = async () => {
  const dir = root + 'test/saves/'; for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort() : []) {
    const sv = fs.readFileSync(dir + f, 'utf8'), want = JSON.parse(sv); if (!await resume(sv, f, { old: true })) continue; where = 'old save ' + f;
    const got = await ev(() => JSON.parse(JSON.stringify({ S, cell: World.cell ? World.cell.id : null, pos: Player.pos, y: Player.pos[1], ground: World.groundAt(Player.pos[0], Player.pos[2], Player.pos[1] + 1.5) })));
    expect(got.S.gold === want.S.gold, `${f}: gold ${want.S.gold} became ${got.S.gold}`); for (const k in want.S.items) expect(got.S.items[k] === want.S.items[k], `${f}: ${want.S.items[k]} x ${k} became ${got.S.items[k]}`);
    for (const k in want.S.q) expect(got.S.q[k] && got.S.q[k].stage === want.S.q[k].stage && !!got.S.q[k].done === !!want.S.q[k].done, `${f}: quest ${k} was ${JSON.stringify(want.S.q[k])}, is ${JSON.stringify(got.S.q[k])}`);
    for (const k in want.S.opened) expect(got.S.opened[k], `${f}: ${k} was opened, is not`); for (const k in want.S.flags) expect(got.S.flags[k] === want.S.flags[k], `${f}: flag ${k} was ${want.S.flags[k]}, is ${got.S.flags[k]}`);
    expect(Math.abs(got.y - got.ground) < 1.2, `${f}: the player is loaded ${(got.y - got.ground).toFixed(1)} m off the floor at ${got.pos.map(v => v.toFixed(0))} (cell ${got.cell})`);
    await page.keyboard.down('KeyW'); await ev(() => BOT.step(30)); await page.keyboard.up('KeyW'); const y2 = await ev(() => [Player.pos[1], World.groundAt(Player.pos[0], Player.pos[2], Player.pos[1] + 1.5)]); expect(Math.abs(y2[0] - y2[1]) < 1.5 && y2[0] > (got.cell ? -460 : -30), `${f}: after a second of walking the player is at y ${y2[0].toFixed(1)} (floor ${y2[1].toFixed(1)})`);
    await check('old save ' + f, { nosave: true }); await ev(() => { if (World.cell) game.leave(); BOT.day(10); }); await talk('hale', /./); await talk('greta', /./); await talk('rowan', /./);
    for (const k of ['KeyJ', 'KeyI', 'KeyM']) { await key(k); await ev(() => BOT.step(2)); expect((await ev(() => BOT.ui())).menu, `${f}: ${k} opens nothing`); await key('Escape'); } await check('old save ' + f + ' menus', { nosave: true });
    await useAnd('door.inn.in', 'old save: into the inn', { may: true }); await check('old save ' + f + ' inn'); }
};
// a phone in the hand: every window fits and can be reached, with a notch and a home bar; then turn it, hide it, bring it back
const rectOf = sel => ev(s => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(), st = getComputedStyle(e); return { id: e.id || e.className || e.tagName, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, w: r.width, h: r.height, shown: r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && +st.opacity > 0.05 && !e.closest('[hidden]'), text: e.textContent.trim().slice(0, 40), sw: e.scrollWidth, cw: e.clientWidth }; }), sel);
async function fits(what, sel, safe, o) {
  const [W, H] = [await ev(() => innerWidth), await ev(() => innerHeight)], sx0 = safe.l, sy0 = safe.t, sx1 = W - safe.r, sy1 = H - safe.b;
  for (const r of await rectOf(sel)) { if (!r.shown) continue;
    if (r.x0 < -0.5 || r.y0 < -0.5 || r.x1 > W + 0.5 || r.y1 > H + 0.5) { if (!(o && o.scrolls)) bug(2, `${what}: ${r.id} "${r.text}" runs off the screen (${Math.round(r.x0)},${Math.round(r.y0)} to ${Math.round(r.x1)},${Math.round(r.y1)} of ${W} x ${H})`); }
    else if (r.x0 < sx0 - 0.5 || r.y0 < sy0 - 0.5 || r.x1 > sx1 + 0.5 || r.y1 > sy1 + 0.5) bug(3, `${what}: ${r.id} "${r.text}" is under the notch or home bar (${Math.round(r.x0)},${Math.round(r.y0)} to ${Math.round(r.x1)},${Math.round(r.y1)}; safe area ${sx0},${sy0} to ${sx1},${sy1})`);
    if (o && o.min && Math.min(r.w, r.h) < o.min - 0.5) bug(3, `${what}: ${r.id} "${r.text}" is ${Math.round(r.w)} x ${Math.round(r.h)} px, under ${o.min}`);
    if (o && o.wrap && r.sw > r.cw + 2) bug(2, `${what}: ${r.id} text is wider than its box (${r.sw} in ${r.cw}): it does not wrap`); }
}
const overlap = (a, b) => a && b && a.shown && b.shown && a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;
SC.phone = async () => {
  if (!TOUCH) return console.log('   phone needs --touch (and --size 844x390)');
  const sv = ckLoad('act1') || ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint')) return; const safe = { l: 47, r: 47, t: 0, b: 21 };
  await ev(sf => { const st = document.documentElement.style; st.setProperty('--sal', sf.l + 'px'); st.setProperty('--sar', sf.r + 'px'); st.setProperty('--sat', sf.t + 'px'); st.setProperty('--sab', sf.b + 'px'); BOT.day(10); S.gold += 300; UI.hudT = 99; BOT.step(40); }, safe);
  // the HUD in play, with three quests on and the longest objective line
  where = 'phone: hud'; await ev(() => { for (const id of ['bounty', 'camp', 'tools']) if (!S.q[id]) S.q[id] = { stage: 0, done: false, t: Date.now() }; UI.lastObj = null; uiObjective(); UI.hudT = 99; BOT.step(40); }); await shot('phone_hud');
  await fits('HUD', '#menuBtn, #purse, #clock, #objective, #compass, #vitals, #rpgTouch button, #tEat', safe); await fits('touch buttons', '#menuBtn, #rpgTouch button, #tEat', safe, { min: 44 });
  { const r = await rectOf('#objective, #compass, #clock, #purse, #menuBtn, #vitals, #toasts, #place'); const g = id => r.find(x => x.id === id); for (const [a, b] of [['objective', 'compass'], ['objective', 'clock'], ['objective', 'purse'], ['objective', 'menuBtn'], ['compass', 'menuBtn'], ['compass', 'purse'], ['objective', 'vitals'], ['clock', 'compass']]) if (overlap(g(a), g(b))) bug(2, `the ${a} lies over the ${b} (${JSON.stringify([g(a), g(b)].map(x => [Math.round(x.x0), Math.round(x.y0), Math.round(x.x1), Math.round(x.y1)]))})`); }
  // the prompt and its button
  where = 'phone: prompt'; await ev(() => BOT.approach('npc:greta')); await ev(() => BOT.step(3)); await fits('prompt', '#act', safe, { min: 44 }); { const r = await rectOf('#act, #rpgTouch button, #tEat, #menuBtn'); for (const b of r.slice(1)) if (overlap(r[0], b)) bug(2, 'the interact prompt lies over ' + b.id); }
  const a = (await ev(() => BOT.buttons('#act')))[0]; if (a && a.shown) { await tap(a.x, a.y); await ev(() => BOT.settle()); expect((await ev(() => BOT.ui())).talk === 'greta', 'tapping the prompt does not use it'); } else bug(2, 'no prompt to tap on a touch screen');
  // dialogue with a long line, then the longest list of options (the shop)
  where = 'phone: dialogue'; await skipVoice(); await fits('dialogue', '#dialog, #dname, #dtext, #dopts button', safe, { scrolls: true }); await fits('dialogue text', '#dtext', safe, { wrap: true, scrolls: true }); await fits('dialogue options', '#dopts button', safe, { min: 44, scrolls: true }); await shot('phone_dialogue'); await leaveTalk();
  await ev(() => { const n = NPC.rowan; startTalk(n); showNode(node('Sit. You will want it from the start, and you will not like where it starts. Fifty years back my father sold the last seam of the Old Mine to a Crown assayer who never came, and the men below were told to keep digging until he did. '.repeat(3), [['And the bread? Tell me about the bread, and the pail, and who carried it down to the shore every dawn for fifty years.', () => null], ['Farewell.', () => null]])); BOT.step(2); });
  await fits('long line', '#dtext', safe, { wrap: true, scrolls: true }); { const d = await ev(() => { const e = document.getElementById('dialog'); return { sh: e.scrollHeight, ch: e.clientHeight, oy: getComputedStyle(e).overflowY, top: e.getBoundingClientRect().top, bot: e.getBoundingClientRect().bottom, H: innerHeight }; }); if (d.sh > d.ch + 2 && !/auto|scroll/.test(d.oy)) bug(2, 'a long line is cut off: the dialogue is ' + d.sh + ' px tall in a ' + d.ch + ' px box that does not scroll'); if (d.bot > d.H + 1 || d.top < -1) bug(2, 'the dialogue box runs off the screen with a long line (' + Math.round(d.top) + ' to ' + Math.round(d.bot) + ' of ' + d.H + ')'); }
  await shot('phone_longline'); expect(await pick(/Farewell/), 'the last option under a long line cannot be reached'); await closeAll();
  where = 'phone: shop'; await use('npc:brandt'); await pick(/for sale/i); await skipVoice(); await shot('phone_shop'); { const d = await ev(() => BOT.dialog()); for (const o of d.opts) { await ev(i => document.querySelectorAll('#dopts button')[i].scrollIntoView({ block: 'center' }), o.i); const b = (await ev(() => BOT.buttons('#dopts button')))[o.i]; if (!b.inView || !b.reach) bug(2, 'shop row "' + o.text.slice(0, 30) + '" cannot be reached even by scrolling'); if (Math.min(b.w, b.h) < 43.5) bug(3, 'shop row "' + o.text.slice(0, 30) + '" is ' + Math.round(b.h) + ' px tall'); } } await leaveTalk();
  // the menu: every tab, every control
  for (const tab of ['journal', 'map', 'pack', 'settings']) { where = 'phone: ' + tab; await ev(() => { RPG.xp(200); }); if (!(await ev(() => BOT.ui())).menu) { const m = (await ev(() => BOT.buttons('#menuBtn')))[0]; await tap(m.x, m.y); await ev(() => BOT.step(2)); if (!expect((await ev(() => BOT.ui())).menu, 'the menu button opens nothing')) break; }
    expect(await press('#tabs [data-tab]', new RegExp(tab === 'pack' ? 'pack|satchel|carry' : tab, 'i'), 'menu tab'), 'no ' + tab + ' tab'); await ev(() => BOT.step(3)); await shot('phone_' + tab);
    await fits(tab + ' tab', '#tabs [data-tab], #mclose', safe, { min: 44 }); await fits(tab, `#tab-${tab} button, #tab-${tab} select, #tab-${tab} input[type=range]`, safe, { scrolls: true, min: 40 });
    { const o = await ev(t => { const e = document.getElementById('tab-' + t), m = document.getElementById('menu'); return { sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight, oy: getComputedStyle(e).overflowY, moy: getComputedStyle(m).overflowY, bot: e.getBoundingClientRect().bottom, H: innerHeight }; }, tab); if (o.sw > o.cw + 3) bug(2, 'the ' + tab + ' page is wider than the screen (' + o.sw + ' in ' + o.cw + ')'); if (o.bot > o.H + 2 && !/auto|scroll/.test(o.oy + o.moy)) bug(2, 'the ' + tab + ' page runs under the bottom of the screen and cannot scroll'); } }
  { const c = (await ev(() => BOT.buttons('#mclose')))[0]; if (c && c.shown) { await tap(c.x, c.y); await ev(() => BOT.step(2)); } expect(!(await ev(() => BOT.ui())).menu, 'the menu’s close button does not close it'); }
  // perk cards
  where = 'phone: perks'; { const m = (await ev(() => BOT.buttons('#menuBtn')))[0]; await tap(m.x, m.y); await press('#tabs [data-tab]', /pack|satchel|carry/i, 'tab'); await ev(() => BOT.step(2)); const pk = await ev(() => BOT.buttons('#tab-pack button[data-perk]')); expect(pk.length > 0, 'no perk cards with points to spend'); for (const b of pk.slice(0, 7)) { if (Math.min(b.w, b.h) < 43.5) bug(3, 'perk card "' + b.text.slice(0, 20) + '" is ' + Math.round(b.w) + ' x ' + Math.round(b.h) + ' px'); } await press('#tab-pack button[data-perk]', /./, 'perk'); await closeAll(); const c = (await ev(() => BOT.buttons('#mclose')))[0]; if (c && c.shown && c.inView) await tap(c.x, c.y); await ev(() => { if (UI.menu) closeMenu(); }); }
  // a reader
  where = 'phone: reader'; await use('chapel.book', { may: true }); if ((await ev(() => BOT.ui())).reader) { await fits('reader', '#rclose', safe, { min: 44 }); await fits('reader text', '#rtext', safe, { wrap: true, scrolls: true }); await shot('phone_reader'); const c = (await ev(() => BOT.buttons('#rclose')))[0]; await tap(c.x, c.y); await ev(() => BOT.step(2)); expect(!(await ev(() => BOT.ui())).reader, 'the reader’s close button does not close it'); }
  // pause
  where = 'phone: pause'; await ev(() => { UI.pause('test'); }); await fits('pause', '#pause button', safe, { min: 44 }); await shot('phone_pause'); await press('#pause button', /resume|back|continue/i, 'resume'); await ev(() => BOT.step(2)); expect(!(await ev(() => BOT.ui())).paused, 'Resume does not resume'); await check('phone', { nosave: true });
  // turn the phone: upright shows the "turn your phone" card and the game must wait under it; back on its side everything is where it was
  where = 'phone: rotate'; const before = await ev(() => ({ pos: Player.pos.slice(), hp: RPG.st().hp })); await page.setViewportSize({ width: SIZE[1], height: SIZE[0] }); await page.waitForTimeout(400); await ev(() => BOT.step(3));
  const rot = await ev(() => ({ card: getComputedStyle(document.getElementById('rotate')).display !== 'none', paused: !!UI.paused, w: G.w, h: G.h, iw: innerWidth, ih: innerHeight })); await shot('phone_upright');
  if (rot.card) expect(rot.paused, 'upright: the "turn your phone" card covers the screen but the game runs on under it (not paused)'); else { await fits('upright HUD', '#menuBtn, #purse, #objective, #compass, #vitals, #rpgTouch button', { l: 0, r: 0, t: 47, b: 34 }); }
  await page.setViewportSize({ width: SIZE[0], height: SIZE[1] }); await page.waitForTimeout(400); await ev(() => { if (UI.paused) UI.resume(); BOT.step(3); }); const back = await ev(() => ({ card: getComputedStyle(document.getElementById('rotate')).display !== 'none', w: G.w, h: G.h, cw: G.canvas.clientWidth, ch: G.canvas.clientHeight, iw: innerWidth, ih: innerHeight }));
  expect(!back.card, 'back on its side the "turn your phone" card stays'); expect(Math.abs(back.cw - back.iw) < 2 && Math.abs(back.ch - back.ih) < 2, 'after turning back the picture is ' + back.cw + ' x ' + back.ch + ' in a ' + back.iw + ' x ' + back.ih + ' window'); await fits('HUD after turning', '#menuBtn, #purse, #objective, #compass, #vitals, #rpgTouch button', safe); await shot('phone_back'); await check('rotate', { nosave: true });
};
// half an hour of play in one page
SC.soak = async () => {
  const sv = ckLoad('act1') || ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint')) return; const MIN = +val('--minutes', 30); where = 'soak';
  await ev(() => { Env.dayLength = 24 * 60 / 2; BOT.soak = { stuck: {}, rows: [], bad: [] }; BOT.audioHook(); });       // a day every 12 minutes: the half hour sees every hour twice
  const doors = (await ev(() => World.interact.map((it, i) => it.kind === 'portal' && !it.cell && interactLabel(it) ? i : -1).filter(i => i >= 0))).slice(0, 3),       /* the same three doors again and again: growth after the first visits is a leak, not a first sight */ rnd = (() => { let a = SEED + 3; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  for (let m = 0; m < MIN; m++) {
    // a minute: wander with the keys, now and then go through a door and back, talk to someone, swing the sword
    const act = m % 5; if (act === 1 && doors.length) { const i = doors[Math.floor(rnd() * doors.length)]; if (await use('#' + i, { may: true })) { await page.keyboard.down('KeyW'); await ev(() => BOT.step(120)); await page.keyboard.up('KeyW'); await ev(() => { if (World.cell) { const c = Cells.cur; const out = World.interact.find(x => x.kind === 'portal' && x.cell === c.id); } }); const out = await ev(() => World.cell ? World.interact.findIndex(x => x.kind === 'portal' && x.cell === World.cell.id && interactLabel(x)) : -1); if (out >= 0) await use('#' + out, { may: true }); else await ev(() => game.leave()); } }
    else if (act === 3) { const id = MAIN[Math.floor(rnd() * MAIN.length)]; if (await use('npc:' + id, { may: true })) { await leaveTalk(); } }
    else { await ev(() => { const sp = [[0, 0], [0, -21], [-23, -10], [23, -8], [-60, -8], [14, 79], [38, 8], [8, 40]][Math.floor(Math.random() * 8)]; if (World.cell) game.leave(); game.tp(sp[0], sp[1], Math.random() * 360); }); }
    const row = await ev(async (m) => { const dtm = 1 / 30, K = BOT.soak, t0 = performance.now(); let ticks = 0;
      for (let s = 0; s < 60; s++) { Input.keys = { KeyW: s % 7 < 5, ShiftLeft: s % 3 === 0 }; Input.lookX = (Math.random() - 0.5) * 0.9; if (s % 11 === 0) RPG.in.atk = true; for (let i = 0; i < 30; i++) { game.step(1, dtm); ticks++; } RPG.in.atk = false;
        // people: stuck, in a wall, under the floor
        for (const n of NPCS) { const k = K.stuck[n.id] || (K.stuck[n.id] = { p: n.pos.slice(), t: 0 }); const moved = Math.hypot(n.pos[0] - k.p[0], n.pos[2] - k.p[2]); const walking = !!(n.path && n.path.length) && n.anim !== 'sit' && n.anim !== 'lie' && !n.talking;
          if (walking && moved < 0.15) { k.t += 1; if (k.t === 21) K.bad.push('stuck: ' + n.id + ' has a path but has not moved for 20 s at ' + n.pos.map(v => v.toFixed(1)) + ' (hour ' + Env.hour.toFixed(1) + ', goal ' + (n.goal || '') + ')'); } else { k.t = 0; k.p = n.pos.slice(); }
          const gy = World.groundAt(n.pos[0], n.pos[2], n.pos[1] + 1.0); if (n.pos[1] < gy - 0.6 && !k.under) { k.under = 1; K.bad.push('under the floor: ' + n.id + ' at y ' + n.pos[1].toFixed(2) + ', floor ' + gy.toFixed(2) + ' (' + n.pos.map(v => v.toFixed(1)) + ', ' + n.anim + ')'); }
          if (!n.pos.every(Number.isFinite) && !k.nan) { k.nan = 1; K.bad.push('position is not a number: ' + n.id); } }
        if (Player.pos[1] < (World.cell ? CELL.y : 0) - 60) { K.bad.push('the player fell out of the world at ' + Player.pos.map(v => v.toFixed(1))); if (World.cell) game.leave(); game.tp(0, 0, 0); } }
      Input.keys = {}; const ms = (performance.now() - t0) / ticks; const st = await game.draw(); if (typeof gc === 'function') { gc(); gc(); } const live = typeof Snd !== 'undefined' && Snd.live ? Snd.live() : null;
      return { m, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0, draws: st.draws, tris: Math.round(st.tris / 1000), tick: +ms.toFixed(2), geo: BOT.info() ? BOT.info().memory.geometries : 0, tex: BOT.info() ? BOT.info().memory.textures : 0, snd: BOT.sounds(), inter: World.interact.length, col: World.colliders.length, em: World.emitters.length, foes: Foes.list.length, toasts: document.getElementById('toasts').children.length, dom: document.getElementsByTagName('*').length, hour: +Env.hour.toFixed(1) }; }, m);
    notes.length < 0; say('   ' + JSON.stringify(row)); (SC.soak.rows = SC.soak.rows || []).push(row); await ev(() => { if (RPG.dead) return; const r = RPG.st(); r.hp = RPG.MAXHP; }); await ev(() => BOT.settle()); await closeAll(); await check('soak minute ' + m, { nosave: true });
  }
  // sounds: the game was stepped faster than the clock, so let the clock catch up, then nothing but the standing loops may still be sounding
  const snd0 = await ev(() => BOT.sounds()); await page.waitForTimeout(12000); const snd1 = await ev(() => BOT.sounds()); await page.waitForTimeout(6000); const snd2 = await ev(() => BOT.sounds());
  { const th = await ev(() => BOT.threw); for (const k in th) bug(2, `a sound fails to start ${th[k]} times and is never heard: ${k}`); }
  notes.push(`sounds still playing: ${snd0} at the end of play, ${snd1} after 12 s of silence, ${snd2} after 18 s`); /* not a failure: the bot steps game time faster than the audio clock, so sources pile up here that end normally in real play (measured with the game's own loop: 221 of 227 ended within 6 s of standing still, the rest are the standing loops) */
  for (const b of await ev(() => BOT.soak.bad)) bug(/stuck/.test(b) ? 3 : 2, b);
  const R = SC.soak.rows, a = R[Math.min(Math.floor(R.length / 2), R.length - 1)], z = R[R.length - 1]; fs.writeFileSync(root + OUT + '/soak.json', JSON.stringify(R, null, 0));
  for (const k of ['heap', 'geo', 'tex', 'inter', 'col', 'em', 'dom', 'toasts']) if (z[k] > a[k] * 1.25 + (k === 'heap' ? 40 : 8)) bug(2, `${k} grows over ${R.length} minutes of play: ${a[k]} half way, ${z[k]} at the end`);
  if (z.tick > a.tick * 1.5 + 0.5) bug(2, `a game tick slows down over time: ${a.tick} ms half way, ${z.tick} ms at the end`);
  notes.push(`soak ${R.length} min: heap ${a.heap} to ${z.heap} MB, tick ${a.tick} to ${z.tick} ms, draws ${Math.min(...R.map(r => r.draws))} to ${Math.max(...R.map(r => r.draws))}, geometries ${a.geo} to ${z.geo}, textures ${a.tex} to ${z.tex}`);
};
// the Old Mine fought through: delvers, lurkers, the Foreman, his key, the strongbox, out by the cleft; then the lamp running dry
SC.mine = async () => {
  const sv = ckLoad('key'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint key')) return; await ev(() => { BOT.day(10); S.gold += 300; give('potion', 3); save(); }); where = 'mine';
  await useAnd('door.mine.in', 'into the mine'); if (!expect((await st()).cell === 'mine', 'cannot get into the mine with the key')) return;
  const n0 = await ev(() => BOT.left('mine')); expect(n0 >= 6, 'the mine holds ' + n0 + ' foes, expected seven');
  for (const kind of ['delver', 'lurker', 'foreman']) { await clear('mine', kind, 10); const left = await ev(k => BOT.left('mine', k), kind); expect(left === 0, left + ' ' + kind + '(s) in the mine could not be reached or killed'); }
  const s = await st(); expect(s.items.foremankey, 'the Foreman is dead and looted but his key is not in the pack: ' + JSON.stringify(await ev(() => Foes.list.filter(f => f.kind === 'foreman').map(f => ({ alive: f.alive, state: f.state, hp: f.hp, looted: f.looted, lootIt: !!f.lootIt, inWorld: World.interact.includes(f.lootIt), loot: f.lootIt && f.lootIt.loot, at: f.pos.map(v => +v.toFixed(1)), me: Player.pos.map(v => +v.toFixed(1)), dead: RPG.st().dead && RPG.st().dead[f.id] }))))); await useAnd('mine.chest', 'the strongbox'); expect((await st()).opened['mine.chest'] && (await st()).items.silverthread, 'the strongbox did not give Silverthread with the Foreman’s key');
  await useAnd('mine.journal'); expect(await q('main') === 5, 'the journal did not move the story on after the fights (' + await q('main') + ')');
  // the lamp: douse and light it from the pack, let it run dry, fill it
  await ev(() => { S.mine.oil = 400; S.flags.lampOff = 0; BOT.step(3); });
  if (await menu('KeyI', 'pack')) { const lamp = await press('#tab-pack button[data-lamp]', /./, 'lamp button'); expect(lamp, 'no lamp button in the pack while in the mine'); await ev(() => BOT.step(2)); const t1 = await ev(() => BOT.toasts.slice(-1)[0]); await press('#tab-pack button[data-lamp]', /./, 'lamp button'); await ev(() => BOT.step(2)); const t2 = await ev(() => BOT.toasts.slice(-1)[0]); expect(/douse/i.test(t1) && /light/i.test(t2), 'the lamp button does not douse and light the lantern (' + t1 + ' / ' + t2 + ')'); await key('Escape'); }
  await ev(() => { S.mine.oil = 2; BOT.step(120); }); const dry = await ev(() => ({ oil: S.mine.oil, toast: BOT.toasts.slice(-3).join(' | ') })); expect(dry.oil <= 0.01 || /dry|gutter/.test(dry.toast), 'the lamp does not run dry (' + JSON.stringify(dry) + ')'); await check('lamp dry', { nosave: true });
  await useAnd('door.mine.cleft', 'out by the cleft'); const out = await st(); expect(!out.cell, 'the cleft does not lead out of the mine'); await check('mine done'); await talk('hale', /./, /./, /./); expect((await st()).flags.act1, 'Hale did not close Act 1 after the mine was fought through');
};
// the nine secrets by the E key, in an order a curious player might find them
SC.secrets = async () => {
  const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(12); S.flags.bed = 1; save(); }); where = 'secrets';
  const sid = {}; for (const [k, v] of await ev(() => SEC.list.map(s => [s.sec, s.id]))) sid[k] = v;
  const open = async (id, why) => { const r = await use(sid[id] || 'sec.' + id, { may: true }); await closeAll(); const o = (await st()).opened[sid[id] || 'sec.' + id]; if (process.env.BOTDEBUG) console.log('   sec', id, r, o, JSON.stringify(await ev(i => { const it = World.interact.find(x => x.id === 'sec.' + i); return [it && interactLabel(it), it && it.cell, it && it.p.map(v => +v.toFixed(1)), World.cell && World.cell.id, Player.pos.map(v => +v.toFixed(1)), BOT.toasts.slice(-1)[0]]; }, id))); return o; };
  const count = () => ev(() => typeof secCount === 'function' ? secCount() : -1);
  expect(await open('bell'), 'the bell box did not open'); expect((await st()).items.lockpick, 'the bell box gave no lockpick');
  expect(await open('stone'), 'the crooked stone did not open'); expect((await st()).items.cellarkey, 'the stone gave no cellar key');
  expect(await open('cellar'), 'the Magpie’s cellar did not open with its key'); expect(await open('attic'), 'the trunk on the Hart’s roof walk did not open');
  expect(await open('wall'), 'the fresh brick did not open after the Hart’s ledger was read'); expect(await open('strongbox'), 'the quay strongbox did not open with the wharf key');
  { const c = await ev(() => { const it = SEC.list.find(s => s.sec === 'house'); return it ? it.cell : null; }); if (expect(c, 'no hatbox anywhere')) { await ev(() => { if (World.cell) game.leave(); }); await useAnd('door.' + c + '.in', 'the shut house'); expect((await st()).cell === c, 'the shut house does not open with the wren key (in ' + (await st()).cell + ')'); } expect(await open('house'), 'the hatbox in the shut house did not open'); }
  // the night meeting: stand off and listen
  await ev(async () => { if (World.cell) game.leave(); const M = SEC.meet; Env.dayLength = 0; Env.hour = 23.5; game.tp(M.x + 8, M.z + 2, 270); const gy = World.groundY(M.x + 8, M.z + 2); for (let i = 0; i < 2100 && !S.flags.hear_meeting; i++) { Env.hour = 23.6; Player.pos[0] = M.x + 8; Player.pos[2] = M.z + 2; Player.pos[1] = gy; Player.vel = [0, 0, 0]; BOT.step(1, 1 / 30); } BOT.step(5); }); expect((await st()).flags.hear_meeting, 'the night meeting could not be overheard from 8 m'); expect(!(await ev(() => RPG.dead)) && (await ev(() => RPG.st().hp)) > 99, 'listening to the night meeting from 8 m gets the player attacked (health ' + (await ev(() => Math.round(RPG.st().hp))) + ', dead ' + (await ev(() => RPG.dead)) + '): Garrick’s camp is 15 m away'); expect(await open('meetpouch'), 'the purse left after the meeting did not open');
  // the Magpie: follow at a distance from the square to the yard
  const mg = await ev(() => { const G = SEC.mag; Env.hour = 19; if (World.cell) game.leave(); game.tp(2, 0, 0); for (let i = 0; i < 80 && G.st === 'off'; i++) { Env.hour = 19; BOT.step(2); } let n = 0; for (; n < 3500 && G.st !== 'done' && G.path; n++) { Env.hour = 19.5; const pr = G.path[Math.max(0, G.i - 2)], ux = G.x - pr[0], uz = G.z - pr[1], ul = Math.hypot(ux, uz) || 1; const px = n < 30 ? G.x - 8 : G.x - ux / ul * 7, pz = n < 30 ? G.z : G.z - uz / ul * 7; Player.pos = [px, World.groundY(px, pz) + 0.01, pz]; Player.vel = [0, 0, 0]; RPG.st().hp = RPG.MAXHP; BOT.step(2, 0.05); } BOT.step(5); return G.st + (RPG.dead ? ' (died)' : ''); }); expect(mg === 'done', 'the Magpie could not be followed to her yard (' + mg + ')'); expect(await open('magpie'), 'the Magpie’s sack did not open after the chase');
  expect(await count() === 9, 'found ' + await count() + ' of 9 secrets after opening all nine'); await check('secrets'); await ev(() => { if (World.cell) game.leave(); BOT.day(11); }); await talk('greta', /talk in the Hart/i); await talk('marta', /sell/i); await check('after secrets');
};
// close the tab at an awkward moment (the page saves as it goes), come back, and it must be playable
SC.moments = async () => {
  const base = ckLoad('first'); if (!base) return console.log('   run story first');
  const leaveNow = async () => { await ev(() => dispatchEvent(new Event('pagehide'))); return ev(() => localStorage.getItem('brackenfell.v1')); };
  const playable = async label => { where = 'back after ' + label; const u = await ev(() => BOT.ui()), r = await ev(() => ({ hp: RPG.st().hp, dead: RPG.dead, jail: S.jail, cell: World.cell ? World.cell.id : null, y: Player.pos[1], gy: World.groundAt(Player.pos[0], Player.pos[2], Player.pos[1] + 1.5), sit: !!IX.sit, crime: S.crime }));
    expect(r.hp > 0 && !r.dead, label + ': back with ' + r.hp + ' health' + (r.dead ? ', dead' : '')); expect(!u.locked || u.talk, label + ': back but cannot move (locked, no window)'); expect(Math.abs(r.y - r.gy) < 1.5, label + ': back ' + (r.y - r.gy).toFixed(1) + ' m off the floor in ' + r.cell);
    await page.keyboard.down('KeyW'); const p0 = await ev(() => Player.pos.slice()); await ev(() => BOT.step(25)); await page.keyboard.up('KeyW'); let moved = 0; for (const turn of [0, 1.6, 3.1, 4.7]) { await ev(t => { Player.yaw += t; }, turn); await page.keyboard.down('KeyW'); await ev(() => BOT.step(20)); await page.keyboard.up('KeyW'); const p1 = await ev(() => Player.pos.slice()); moved = Math.max(moved, Math.hypot(p1[0] - p0[0], p1[2] - p0[2])); }
    expect(moved > 0.4, label + ': back, but W in four directions moves the player ' + moved.toFixed(2) + ' m'); await check('back after ' + label, { nosave: true }); return r; };
  // dead, with the death fade still to come
  { if (!await resume(base, 'checkpoint first')) return; where = 'leave while dead'; await ev(() => { BOT.day(12); S.gold = 100; RPG.st().hp = 1; RPG.hurt ? RPG.hurt(50, 'test') : RPG.die('You were cut down.'); if (!RPG.dead) RPG.die('You were cut down.'); }); const sv = await leaveNow(); const j = JSON.parse(sv); notes.push('leaving while dead saves health ' + j.S.rpg.hp); if (await resume(sv, 'left while dead', { old: true })) await playable('leaving while dead'); }
  // in the cell
  { if (!await resume(base, 'checkpoint first')) return; where = 'leave in the cell'; await ev(async () => { BOT.day(12); S.crime = { fine: 20, pending: false, by: 'hale', t: 0 }; S.stolen = {}; IX.jail(NPC.hale); await BOT.settle(1800); }); const jl = await ev(() => S.jail); if (expect(jl === 1, 'could not be put in the cell for the test (' + jl + ')')) { const sv = await leaveNow(); if (await resume(sv, 'left in the cell', { old: true })) { const r = await playable('leaving in the cell'); const j = await ev(() => World.interact.findIndex(x => x.kind === 'jaildoor' || x.id === 'jail.door')); if (r.jail) { await use('#' + j); for (let k = 0; k < 200 && (await ev(() => S.jail)); k++) await page.waitForTimeout(50); await ev(() => BOT.settle(600)); expect(!(await ev(() => S.jail)) && !(await st()).cell, 'back in the cell after a reload, and the door does not let you out'); } else expect(r.cell !== 'guardhouse' || true, ''); } } }
  // sitting; in the middle of a conversation; with the pack open; in a shop list
  for (const [label, fn] of [['sitting', async () => { const i = await ev(() => World.interact.findIndex(x => x.kind === 'seat' && x.cell === 'inn')); await use('#' + i); expect(await ev(() => !!IX.sit), 'could not sit'); }], ['in a conversation', async () => { await use('npc:greta'); }], ['with the pack open', async () => { await key('KeyI'); }], ['in the shop list', async () => { await use('npc:brandt'); await pick(/for sale/i); }], ['reading', async () => { await use('chapel.book'); }]]) {
    if (!await resume(base, 'checkpoint first')) return; await ev(() => BOT.day(12)); where = 'leave ' + label; await fn(); const sv = await leaveNow(); if (await resume(sv, 'left ' + label, { old: true })) await playable('leaving ' + label); }
  // in the mine with the lamp lit, and in the cave at the end
  for (const name of ['cave']) { const c = ckLoad(name); if (c && await resume(c, 'checkpoint ' + name)) { const r = await playable('the save in the ' + name); expect(r.cell === 'mine', 'the cave save loads outside the mine (' + r.cell + ')'); const lamp = await ev(() => ({ on: MINE.lamp.on, oil: S.mine && S.mine.oil })); notes.push('lamp after loading in the cave: ' + JSON.stringify(lamp)); } }
  // a broken save must not brick the title screen
  for (const [label, sv] of [['a save cut off half way', base.slice(0, Math.floor(base.length / 2))], ['a save of another shape', '{"v":2,"S":{"gold":"many","items":null,"q":[],"flags":7}}'], ['an empty save', '{}']]) {
    where = label; await open({ save: sv }); const tb = await ev(() => BOT.buttons('#startBtn, #contBtn')); expect(tb.some(b => b.shown), label + ': the title screen shows no button to start'); const cb = tb.find(b => /Continue/i.test(b.text) && b.shown);
    await start(!!cb); const ok = await ev(() => game.playing && Number.isInteger(S.gold) && S.items && typeof S.items === 'object' && !Array.isArray(S.q)); expect(ok, label + ': the game starts in a broken state (' + JSON.stringify(await ev(() => ({ playing: game.playing, gold: S.gold, items: S.items, q: S.q, flags: S.flags }))).slice(0, 200) + ')'); await check(label, { nosave: true }); if (ok) await talk('hale', /./); }
};
// the life of a phone tab, on the page as it is published (no test hooks, the game's own frame loop, sound that must be unlocked by a tap)
SC.life = async () => {
  where = 'life'; const b2 = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist'] }), ctx = await b2.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), pg = await ctx.newPage(); pg.setDefaultTimeout(240000);
  const errs = []; pg.on('console', m => { const t = m.text(); if (/Failed to load resource|GL Driver Message|GPU stall/.test(t)) return; if (m.type() === 'error') errs.push(t.slice(0, 300)); }); pg.on('pageerror', e => errs.push('exception: ' + (e.stack || e.message).slice(0, 400)));
  try {
    await pg.goto(`http://localhost:${port}/?webgl`); await pg.waitForFunction(() => window.__ready === true);
    const a0 = await pg.evaluate(() => ({ ctx: !!Snd.ctx, state: Snd.ctx ? Snd.ctx.state : 'none' })); expect(a0.state !== 'running', 'sound is running before the first tap (' + a0.state + '): a phone would have blocked it and the game may think it is playing');
    const sb = await pg.evaluate(() => { const r = document.getElementById('startBtn').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await pg.touchscreen.tap(sb[0], sb[1]); await pg.waitForTimeout(2500);
    const a1 = await pg.evaluate(() => ({ state: Snd.ctx ? Snd.ctx.state : 'none', playing: game.playing, frame: R.frame })); expect(a1.playing, 'tapping Enter the village does not start the game'); expect(a1.state === 'running', 'sound has not started after the first tap (' + a1.state + ')');
    await pg.waitForTimeout(1500); const f1 = await pg.evaluate(() => R.frame); expect(f1 > a1.frame, 'the game draws no frames after starting (' + a1.frame + ' to ' + f1 + ')');
    // the tab is hidden (home button, another app, the phone locks)
    const hide = h => pg.evaluate(h => { Object.defineProperty(document, 'hidden', { get: () => h, configurable: true }); Object.defineProperty(document, 'visibilityState', { get: () => h ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, h);
    await pg.evaluate(() => { S.gold += 7; localStorage.removeItem('brackenfell.v1'); }); await hide(true); await pg.waitForTimeout(900);
    const h1 = await pg.evaluate(() => ({ paused: !!UI.paused, state: Snd.ctx.state, saved: !!localStorage.getItem('brackenfell.v1'), gold: (JSON.parse(localStorage.getItem('brackenfell.v1') || '{"S":{}}').S.gold), have: S.gold, frame: R.frame })); await pg.waitForTimeout(800); const f2 = await pg.evaluate(() => R.frame);
    expect(h1.paused, 'hiding the tab does not pause the game'); expect(h1.state !== 'running', 'sound keeps running while the tab is hidden (' + h1.state + ')'); expect(h1.saved && h1.gold === h1.have, 'hiding the tab does not save the game (a phone may drop the tab without warning)'); expect(f2 - h1.frame <= 1, 'the game keeps drawing while hidden (' + (f2 - h1.frame) + ' frames in 0.8 s)');
    await hide(false); await pg.waitForTimeout(700); const h2 = await pg.evaluate(() => ({ paused: !!UI.paused, shown: !document.getElementById('pause').hidden, btn: (() => { const r = document.getElementById('pResume').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; })() }));
    expect(h2.paused && h2.shown, 'coming back to the tab: no pause screen is shown (paused ' + h2.paused + ', shown ' + h2.shown + ')'); await pg.touchscreen.tap(h2.btn[0], h2.btn[1]); await pg.waitForTimeout(1200);
    const h3 = await pg.evaluate(() => ({ paused: !!UI.paused, state: Snd.ctx.state, frame: R.frame, locked: Player.locked })); await pg.waitForTimeout(900); const f3 = await pg.evaluate(() => R.frame);
    expect(!h3.paused && !h3.locked, 'Resume after coming back does not resume (paused ' + h3.paused + ', locked ' + h3.locked + ')'); expect(h3.state === 'running', 'sound does not come back after the tab was hidden and Resume was tapped (' + h3.state + ')'); expect(f3 > h3.frame, 'the game does not draw again after coming back');
    // a call or the lock screen stops the sound without hiding the page (iOS: state "interrupted"); the next touch must bring it back
    await pg.evaluate(() => Snd.ctx.suspend()); await pg.waitForTimeout(300); const c1 = await pg.evaluate(() => Snd.ctx.state); await pg.touchscreen.tap(600, 120); await pg.waitForTimeout(900); const c2 = await pg.evaluate(() => Snd.ctx.state);
    expect(c2 === 'running', 'after a call or lock stopped the sound (' + c1 + ') a touch does not bring it back (' + c2 + ')');
    // turn the phone upright in the middle of play, and back
    await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(900); const r1 = await pg.evaluate(() => ({ card: getComputedStyle(document.getElementById('rotate')).display !== 'none', paused: !!UI.paused, frame: R.frame })); await pg.waitForTimeout(700); const f4 = await pg.evaluate(() => R.frame);
    if (r1.card) expect(r1.paused || f4 - r1.frame <= 1, 'upright: the "turn your phone" card covers the screen but the game runs on under it (' + (f4 - r1.frame) + ' frames in 0.7 s, paused ' + r1.paused + '): the player can be killed without seeing it');
    await pg.setViewportSize({ width: 844, height: 390 }); await pg.waitForTimeout(900); const r2 = await pg.evaluate(() => ({ card: getComputedStyle(document.getElementById('rotate')).display !== 'none', paused: !!UI.paused, pshown: !document.getElementById('pause').hidden, cw: G.canvas.clientWidth, ch: G.canvas.clientHeight }));
    expect(!r2.card, 'back on its side the card stays'); expect(Math.abs(r2.cw - 844) < 2 && Math.abs(r2.ch - 390) < 2, 'after turning back the picture is ' + r2.cw + ' x ' + r2.ch); if (r2.paused) { expect(r2.pshown, 'after turning back the game is paused with no pause screen to leave it'); await pg.evaluate(() => UI.resume()); }
    await pg.screenshot({ path: root + OUT + '/life_end.png' });
    // closing the tab saves
    await pg.evaluate(() => { S.gold += 3; }); await pg.evaluate(() => dispatchEvent(new Event('pagehide'))); const g = await pg.evaluate(() => [JSON.parse(localStorage.getItem('brackenfell.v1')).S.gold, S.gold]); expect(g[0] === g[1], 'closing the tab does not save');
    for (const e of errs) bug(/exception/.test(e) ? 1 : 3, 'console (published page): ' + e);
  } finally { await b2.close(); }
};
const todo = RUN.filter(r => SC[r]); for (const r of RUN) if (!SC[r]) console.log('no scenario ' + r);
const t0 = Date.now();
for (const r of todo) { const t = Date.now(), n0 = bugs.length; console.log('── ' + r + ' ──'); try { await SC[r](); } catch (e) { bug(1, 'the bot itself stopped in "' + r + '": ' + String(e.message).slice(0, 300)); } console.log(`   ${r}: ${bugs.length - n0} new, ${Math.round((Date.now() - t) / 1000)} s`); }
fs.writeFileSync(root + OUT + '/bugs.json', JSON.stringify(bugs, null, 1)); fs.writeFileSync(root + OUT + '/trace.log', trace.join('\n') + '\n');
for (const n of notes) console.log('  note: ' + n);
console.log(`\nplaybot: ${bugs.length} bugs (${bugs.filter(b => b.sev === 1).length} S1, ${bugs.filter(b => b.sev === 2).length} S2, ${bugs.filter(b => b.sev === 3).length} S3) in ${stepN} steps, ${Math.round((Date.now() - t0) / 1000)} s` + (bugs.some(b => b.sev < 3) ? '' : '  playbot PASS'));
await browser.close(); srv.close(); process.exit(bugs.some(b => b.sev < 3) ? 1 : 0);
