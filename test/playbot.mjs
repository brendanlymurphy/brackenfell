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
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

// ───────────── the part that lives in the page: eyes and legs, never hands ─────────────
const IN_PAGE = () => {
  const dt = 1 / 30, sleep = ms => new Promise(r => setTimeout(r, ms));
  const B = window.BOT = { errs: [], toasts: [] };
  { const t0 = window.toast; window.toast = function (h) { B.toasts.push(String(h).replace(/<[^>]+>/g, '')); if (B.toasts.length > 60) B.toasts.shift(); return t0.apply(this, arguments); }; }
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
  B.aim = () => { let best = null, bd = 20; for (const f of Foes.list) { if (!(f.hp > 0) || f.alive === false || f.state === 'dead' || f.state === 'gone' || f.state === 'off') continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]); if (Math.abs(f.pos[1] - Player.pos[1]) < 3 && d < bd) { bd = d; best = f; } } if (!best) return -1; Player.yaw = Math.atan2(best.pos[0] - Player.pos[0], -(best.pos[2] - Player.pos[2])); Player.pitch = 0; Input.lookX = Input.lookY = 0; return bd; };
  // stand a few metres from the nearest living foe of a camp (or kind): the walk there is skipped, the fight is not
  B.hunt = (campId, kind) => { let best = null, bd = 1e9; for (const f of Foes.list) { if (!f.alive || !(f.hp > 0) || f.state === 'gone') continue; if (campId && (!f.camp || f.camp.id !== campId)) continue; if (kind && f.kind !== kind) continue; const d = Math.hypot(f.pos[0] - Player.pos[0], f.pos[2] - Player.pos[2]) + Math.abs(f.pos[1] - Player.pos[1]) * 50; if (d < bd) { bd = d; best = f; } }
    if (!best) return false; for (const rad of [4, 3, 5, 2.2]) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, x = best.pos[0] + Math.sin(a) * rad, z = best.pos[2] - Math.cos(a) * rad, gy = World.groundAt(x, z, best.pos[1] + 1.2); if (Math.abs(gy - best.pos[1]) > 1.2) continue; Cells.teleport({ p: [x, gy, z], yaw: 0 }); game.step(2, dt); if (Math.hypot(Player.pos[0] - x, Player.pos[2] - z) < 0.6) return true; } return 'no place to stand near ' + (best.name || best.kind); };
  B.left = (campId, kind) => Foes.list.filter(f => f.alive && f.hp > 0 && f.state !== 'gone' && (!campId || f.camp && f.camp.id === campId) && (!kind || f.kind === kind)).length;
  B.loots = () => World.interact.map((it, i) => it.kind === 'loot' && Math.hypot(it.p[0] - Player.pos[0], it.p[2] - Player.pos[2]) < 30 ? i : -1).filter(i => i >= 0);
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
  if (!r.ok) { if (!(o && o.may)) bug(r.nolabel ? 2 : 2, `cannot use ${id}: ${r.why}`); return false; }
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
  const w0 = where; let swings = 0, killed = 0, last = null; await ev(() => { Input.plock = true; });
  const atk = async down => { if (TOUCH) { const b = (await ev(() => BOT.buttons('#tAtk')))[0]; if (!b || !b.shown) { bug(2, 'no attack button on a touch screen'); return; } await page.dispatchEvent('#tAtk', down ? 'pointerdown' : 'pointerup', { pointerId: 9, pointerType: 'touch', bubbles: true }); } else if (down) await page.mouse.down(); else await page.mouse.up(); };
  for (let i = 0; i < 400; i++) {
    const f = await ev(() => BOT.foe()), u = await ev(() => BOT.ui()); if (u.dead) { await atk(false); await page.keyboard.up('KeyW'); return { died: true, swings, killed }; } if (!f) break;
    if (last && f.kind + f.hp !== last && f.hp > 0 && false) killed++; last = f.kind + f.hp;
    const d = await ev(() => BOT.aim()); if (d > 1.7) await page.keyboard.down('KeyW'); else await page.keyboard.up('KeyW');
    await atk(true); await ev(() => { for (let k = 0; k < 5; k++) { BOT.aim(); BOT.step(1); } }); await atk(false); await ev(() => { for (let k = 0; k < 7; k++) { BOT.aim(); BOT.step(1); } }); swings++;
    if (swings === 399) bug(2, `a ${f.kind} (${f.state}, ${f.hp} health) could not be killed in 400 swings`);
  }
  await atk(false); await page.keyboard.up('KeyW'); await ev(() => BOT.step(5)); where = w0; return { died: false, swings };
}
const closeAll = async () => { for (let i = 0; i < 4; i++) { const u = await ev(() => BOT.ui()); if (u.reader || u.menu || u.talk) await key('Escape'); else break; } };
const q = id => ev(i => qAt(i), id), st = () => ev(() => ({ gold: S.gold, items: S.items, flags: S.flags, q: Object.fromEntries(Object.keys(S.q).map(k => [k, qAt(k)])), cell: World.cell ? World.cell.id : null, hp: RPG.st().hp, opened: S.opened }));
const expect = (c, what, sev) => { if (!c) bug(sev || 2, what); return !!c; };
async function useAnd(id, label, o) { const ok = await use(id, o); await closeAll(); await check(label || 'use ' + id); return ok; }
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
  await talk('rowan', /./); await talk('rowan', /./, /./, /./, /./); expect((await st()).flags.act2, 'Rowan did not tell it (act2)'); expect(await q('main') === 7, 'stage after Rowan ' + await q('main'));
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
const CK = {}; const ck = async name => { await ev(() => { save(); }); CK[name] = await ev(() => localStorage.getItem('brackenfell.v1')); fs.writeFileSync(root + OUT + '/ck_' + name + '.json', CK[name]); };
const ckLoad = name => CK[name] || (fs.existsSync(root + OUT + '/ck_' + name + '.json') ? fs.readFileSync(root + OUT + '/ck_' + name + '.json', 'utf8') : null);
// load a save the way a person does (the page boots with it in storage, Continue is pressed) and compare what the game then holds with what was saved
async function resume(sv, label, o) {
  where = 'load ' + label; await open({ save: sv }); const want = JSON.parse(sv);
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
  for (const name of ['start', 'first', 'key', 'act1', 'cave', 'bread', 'rest']) { const sv = ckLoad(name); if (!sv) { console.log('   no checkpoint ' + name + ' (run story first)'); continue; }
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
    const [kind, id] = kinds[i]; where = 'sweep ' + kind + ' ' + id; const g0 = await ev(() => S.gold);
    const r = await ev(i => BOT.approach('#' + i), i); if (!r.ok) { if (!r.nolabel) { (un[kind] = un[kind] || []).push(id + (r.why.includes('instead') ? ' ' + r.why.slice(r.why.indexOf('(')) : '')); } continue; }
    await key('KeyE'); await ev(() => BOT.settle()); let u = await ev(() => BOT.ui());
    if (u.reader) { const t = await ev(() => document.getElementById('rtext').textContent + '|' + document.getElementById('rtitle').textContent); if (t.length < 12 || /undefined|NaN|\[object/.test(t)) bug(2, `reading ${id}: broken or empty text "${t.slice(0, 80)}"`); const cb = (await ev(() => BOT.buttons('#reader button')))[0]; if (cb && (!cb.inView || !cb.reach)) bug(2, 'the reader’s close button cannot be pressed (' + id + ')'); await key('Escape'); u = await ev(() => BOT.ui()); if (u.reader) bug(1, 'the reader does not close with Escape (' + id + ')'); }
    if (u.talk) { for (let c = 0; c < 3 && (await ev(() => BOT.ui())).talk; c++) { const d = await ev(() => BOT.dialog()); if (!d.opts.length) break; const o = d.opts[Math.floor(rnd() * d.opts.length)]; await skipVoice(); await tap(o.x, o.y); await ev(() => BOT.settle()); } await leaveTalk(); }
    await closeAll(); if (kind === 'seat') { await page.keyboard.down('KeyW'); await ev(() => BOT.step(8)); await page.keyboard.up('KeyW'); }
    await ev(() => { if (S.jail) IX.release('wait'); if (RPG.st().hp < 60) RPG.st().hp = 100; }); await ev(() => BOT.settle()); await check(where, { nosave: i % 25 !== 0 });
    if (i % 200 === 0) say(`   sweep ${i} / ${n}`);
  }
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
  let deaths = 0; for (let n = 0; n < (max || 12); n++) { const left = await ev(([c, k]) => BOT.left(c, k), [campId, kind]); if (!left) break; const h = await ev(([c, k]) => BOT.hunt(c, k), [campId, kind]); if (h !== true) { if (h) bug(3, 'hunt: ' + h); break; }
    const r = await fight(); if (r.died) { deaths++; await ev(() => BOT.settle(1500)); await check('death while clearing ' + (campId || kind), { nosave: true }); if (deaths > 2) break; } await ev(() => { const r = RPG.st(); r.hp = RPG.MAXHP; r.sta = RPG.MAXST; }); }
  for (const i of await ev(() => BOT.loots())) { await use('#' + i, { may: true }); await closeAll(); } await check('clearing ' + (campId || kind)); return deaths;
}
async function menu(keyName, tab) { await key(keyName); const u = await ev(() => BOT.ui()); if (!u.menu) { bug(2, 'the ' + tab + ' does not open with ' + keyName); return false; } return true; }
// side quests, shops, the board, perks, the bounty, by the buttons a player uses
SC.side = async () => {
  const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(11); S.gold += 400; save(); });
  // the shop: buy the three things a new player wants, sell one back
  where = 'shop'; await use('npc:brandt'); expect(await pick(/for sale/i), 'Brandt has no "for sale" option'); let d = await ev(() => BOT.dialog()); expect(d.opts.length >= 4, 'the shop lists ' + d.opts.length + ' things'); for (const o of d.opts) if (!o.inView || !o.reach) bug(2, 'shop row "' + o.text.slice(0, 40) + '" cannot be pressed (' + (o.inView ? 'covered by ' + o.under : 'off screen') + ')');
  const g0 = (await st()).gold; expect(await pick(/Iron arming sword|longsword/i), 'no sword in the shop'); const s1 = await st(); expect(s1.gold < g0, 'buying a sword cost nothing'); await pick(/Something else/i); await pick(/jerkin|hauberk|gambeson/i); await leaveTalk(); await check('shop');
  await use('npc:brandt'); if (await pick(/things to sell/i)) { d = await ev(() => BOT.dialog()); const g1 = (await st()).gold; if (d.opts.length > 1) { await tap(d.opts[0].x, d.opts[0].y); await ev(() => BOT.settle()); expect((await st()).gold > g1, 'selling "' + d.opts[0].text.slice(0, 30) + '" paid nothing'); } } else bug(2, 'Brandt will not buy'); await leaveTalk(); await check('sell');
  // the pack: open it, press a perk, eat, close
  where = 'pack'; await ev(() => { RPG.xp(200); }); if (await menu('KeyI', 'pack')) { const pk = await ev(() => BOT.buttons('#tab-pack button')); for (const b of pk) if (b.shown && (!b.inView && false || TOUCH && Math.min(b.w, b.h) < 43.5)) bug(3, 'pack button "' + b.text.slice(0, 30) + '" is ' + Math.round(b.w) + ' x ' + Math.round(b.h) + ' px');
    const pts = await ev(() => RPG.st().perkPts); expect(pts > 0, 'no perk point after levelling'); const ok = await press('#tab-pack button[data-perk]', /./, 'perk'); expect(ok, 'no perk card to press in the pack with ' + pts + ' points'); await ev(() => BOT.step(2)); expect((await ev(() => RPG.st().perkPts)) === pts - 1, 'pressing a perk did not spend the point'); await key('Escape'); expect(!(await ev(() => BOT.ui())).menu, 'the pack does not close with Escape'); } await check('perk');
  for (const [k, tab] of [['KeyJ', 'journal'], ['KeyM', 'map']]) { where = tab; if (await menu(k, tab)) { await ev(() => BOT.step(3)); await shot('menu_' + tab); await key('Escape'); } } await check('menus', { nosave: true });
  // the notice board: take the outlaw job, do it, collect
  where = 'board'; await use('board'); let u = await ev(() => BOT.ui()); if (u.reader) await key('Escape'); u = await ev(() => BOT.ui()); if (u.talk !== 'board') { await closeAll(); await use('board'); u = await ev(() => BOT.ui()); }
  expect(u.talk === 'board', 'the notice board opens no list of jobs (' + JSON.stringify(u) + ')'); await pick(/Outlaws on the passes/i); await leaveTalk(); expect(await ev(() => RPG.st().job && RPG.st().job.id) === 'outlaws', 'the outlaw notice was not taken');
  const deaths = await clear('pines'); notes.push('camp in the pines cleared with ' + deaths + ' deaths'); expect(await ev(() => BOT.left('pines')) === 0, 'the camp in the pines could not be cleared (' + await ev(() => BOT.left('pines')) + ' left)');
  expect(await q('camp') >= 1 || await q('camp') === -1, 'camp quest state ' + await q('camp')); await ev(() => { game.leave(); BOT.day(11); });
  await talk('rowan', /camp|outlaw|pines|empty/i); expect([99, -1].includes(await q('camp')), 'Rowan did not close the camp quest (' + await q('camp') + ')');
  await use('board'); if ((await ev(() => BOT.ui())).reader) { await key('Escape'); await use('board'); } const done = await ev(() => RPG.st().job && RPG.st().job.done); if (done) { const g = (await st()).gold; expect(await pick(/Collect/i), 'no "Collect the pay" on the board with the job done'); expect((await st()).gold === g + 35, 'the board paid ' + ((await st()).gold - g) + ' for the outlaw job, not 35'); } else notes.push('outlaw job needs 4 kills; the camp gave ' + await ev(() => RPG.st().job && RPG.st().job.n)); await leaveTalk(); await check('board');
  // Garrick's camp: the tools, the bounty
  await clear('garrick'); await ev(() => { game.leave(); BOT.day(11); }); const s2 = await st(); if (s2.items.tools) { await talk('brandt', /tools|tongs/i); expect(await q('tools') === 99, 'Brandt did not take his tools back (' + await q('tools') + ')'); } else notes.push('no tools from Garrick’s camp: ' + JSON.stringify(Object.keys(s2.items)));
  const bn = await ev(() => bountyN()); if (await q('bounty') === 1) { const g = (await st()).gold; await talk('hale', /bounty/i); expect(await q('bounty') === 99 && (await st()).gold > g, 'Hale did not pay the bounty (' + await q('bounty') + ')'); } else notes.push('bounty at ' + bn + ' of 5, quest ' + await q('bounty'));
  // sleep in your own bed
  await ev(() => BOT.day(22)); await useAnd('inn.bed', 'sleep'); expect(Math.abs((await ev(() => Env.hour)) - 7) < 0.6, 'sleeping did not bring the morning (hour ' + (await ev(() => Env.hour)).toFixed(1) + ')');
  // the wilds: tea for Maren
  await ev(() => BOT.day(11)); await talk('maren', /tea|bogbean|remed|else/i); if (await q('tea') === 0) { for (const it of ['bogbean', 'sunwort', 'stonecrop']) { const i = await ev(n => World.interact.findIndex(x => x.kind === 'pickup' && x.item === n && !x.gone), it); if (i < 0) { bug(2, 'no ' + it + ' to pick anywhere'); continue; } await use('#' + i); await check('pick ' + it); } await talk('maren', /./); expect(await q('tea') === 99, 'Maren did not take the tea herbs (' + await q('tea') + ')'); } else notes.push('tea quest not offered here (' + await q('tea') + ')');
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
SC.death = async () => {
  const sv = ckLoad('first'); if (!sv) return console.log('   run story first'); if (!await resume(sv, 'checkpoint first')) return; await ev(() => { BOT.day(12); S.gold = 100; save(); });
  for (const place of ['pines', 'mine']) {
    where = 'death at ' + place; if (place === 'mine') { await ev(() => { give('minekey'); give('lantern'); S.flags.mineOpen = 1; }); await useAnd('door.mine.in', 'into the mine', { may: true }); }
    const h = await ev(c => BOT.hunt(c === 'mine' ? null : c, c === 'mine' ? 'delver' : null), place); if (h !== true) { bug(3, 'no foe to die to at ' + place + ': ' + h); continue; }
    const g = (await st()).gold; await ev(() => { RPG.st().hp = 6; }); let u; for (let k = 0; k < 900; k++) { u = await ev(() => { BOT.aim(); BOT.step(3); return BOT.ui(); }); if (u.dead) break; } if (!expect(u.dead, 'stood by a ' + place + ' foe for 90 s at 6 health and did not die')) continue;
    for (let k = 0; k < 200 && (await ev(() => BOT.ui())).dead; k++) await page.waitForTimeout(50); await ev(() => BOT.settle(900)); const s = await st(), w = await ev(() => ({ dead: RPG.dead, locked: Player.locked, msg: !document.getElementById('deadMsg').hidden, y: Player.pos[1], cell: World.cell ? World.cell.id : null, hour: Env.hour, toast: BOT.toasts.slice(-1)[0] }));
    expect(!w.dead && !w.locked, 'after dying the player stays dead or locked (' + JSON.stringify(w) + ')'); expect(!w.msg, 'the death message stays on screen'); expect(s.hp > 50, 'health after respawn is ' + s.hp); expect(g - s.gold === Math.min(80, Math.floor(g * 0.25)), 'death cost ' + (g - s.gold) + ' of ' + g + ' gold'); expect(w.cell === 'inn', 'respawn with a bed at the Hart is in "' + w.cell + '", not in the inn (y ' + w.y.toFixed(1) + ')');
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
    await talk('rowan', /./); await talk('rowan', /./, /./, /./, /./); expect((await st()).flags.act2, 'order A: Rowan did not tell it'); }
  // B: the wall and the tunnel before Rowan has spoken; the slab before the journal
  { const sv = ckLoad('key'); if (!await resume(sv, 'checkpoint key')) return; await ev(() => BOT.day(10)); where = 'order B';
    await useAnd('sec.wall', 'the wall before Rowan', { may: true }); const o1 = (await st()).opened['sec.wall']; notes.push('order B: the Hart wall ' + (o1 ? 'opens' : 'stays shut') + ' before Rowan tells of it');
    const r = await ev(() => BOT.approach('door.tunnel.in')); if (r.ok) { await key('KeyE'); await ev(() => BOT.settle()); const c = (await st()).cell; if (c === 'mine') { const m = await q('main'); notes.push('order B: tunnel entered early, story stage ' + m); await ev(() => Foes.calm(true)); const sl = await ev(() => BOT.approach('mine.slab')); if (sl.ok) { await key('KeyE'); await ev(() => BOT.settle()); const u = await ev(() => BOT.ui()); if (u.talk) { const d = await ev(() => BOT.dialog()); notes.push('order B: the slab offers ' + d.opts.map(o => o.text).join(' | ')); await leaveTalk(); } } await check('order B in the cave'); await ev(() => game.leave()); } }
    await ev(() => { game.leave(); BOT.day(10); }); await talk('rowan', /./); await talk('hale', /./); await check('order B'); }
  // C: both endings refused first (walk away from the slab), then the mine door again, then choose
  { const sv = ckLoad('cave'); if (!await resume(sv, 'checkpoint cave')) return; where = 'order C'; await use('mine.slab'); await leaveTalk(); expect(!(await st()).flags.ending, 'leaving the slab without choosing set an ending');
    await ev(() => { game.leave(); BOT.day(10); }); await talk('rowan', /./); await talk('greta', /./); await useAnd('door.mine.in', 'back into the mine'); expect((await st()).cell === 'mine', 'order C: cannot go back into the mine before the ending'); await check('order C'); }
};
const todo = RUN.filter(r => SC[r]); for (const r of RUN) if (!SC[r]) console.log('no scenario ' + r);
const t0 = Date.now();
for (const r of todo) { const t = Date.now(), n0 = bugs.length; console.log('── ' + r + ' ──'); try { await SC[r](); } catch (e) { bug(1, 'the bot itself stopped in "' + r + '": ' + String(e.message).slice(0, 300)); } console.log(`   ${r}: ${bugs.length - n0} new, ${Math.round((Date.now() - t) / 1000)} s`); }
fs.writeFileSync(root + OUT + '/bugs.json', JSON.stringify(bugs, null, 1)); fs.writeFileSync(root + OUT + '/trace.log', trace.join('\n') + '\n');
for (const n of notes) console.log('  note: ' + n);
console.log(`\nplaybot: ${bugs.length} bugs (${bugs.filter(b => b.sev === 1).length} S1, ${bugs.filter(b => b.sev === 2).length} S2, ${bugs.filter(b => b.sev === 3).length} S3) in ${stepN} steps, ${Math.round((Date.now() - t0) / 1000)} s` + (bugs.some(b => b.sev < 3) ? '' : '  playbot PASS'));
await browser.close(); srv.close(); process.exit(bugs.some(b => b.sev < 3) ? 1 : 0);
