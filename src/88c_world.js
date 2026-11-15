// ───────────────────────── Snd reads the game: state for the beds, and the sounds that follow gameplay ─────────────────────────
// Everything here is read-only against the game (player, camera, World, ENV, NPCs, foes, doors); nothing is hooked except a few Audio2 shim calls.
// Footsteps are timed from Player.step, doors from World.doors[].open, the smith's hammer from NPC.brandt.t, the bell from Env.hour, the lute from NPC.lark.
(() => {
  const K = Snd, G = K.G, sat = x => x < 0 ? 0 : x > 1 ? 1 : x, hyp2 = (a, b) => Math.sqrt(a * a + b * b), RN = (a, b) => a + Math.random() * (b - a);
  const tick = (id, n) => K.frame % n === (id % n);
  G.fires = [{ on: false, x: 0, y: 0, z: 0, zone: 0, ref: 1.5, max: 30, lvl: 0 }, { on: false, x: 0, y: 0, z: 0, zone: 0, ref: 1.5, max: 30, lvl: 0 }, { on: false, x: 0, y: 0, z: 0, zone: 0, ref: 1.5, max: 30, lvl: 0 }];
  G.lanternNear = null; G.nLan = 0; G.innZone = 0; G.millZone = 0; G.lark = { on: false, x: 0, y: 0, z: 0, zone: 0, d: 99 };
  G.sqX = 0; G.sqY = 0; G.sqZ = -2; G.mkX = 34.5; G.mkY = 0; G.mkZ = 0.7; G.innX = 0; G.innY = 0; G.innZ = -22; G.millX = 0; G.millY = 0; G.millZ = 0;
  G.riverD = 99; G.riverX = 0; G.riverY = 0; G.riverZ = 0; G.lakeD = 99; G.lakeX = 0; G.lakeY = 0; G.lakeZ = 0; G.meadow = 0.5; G.forest = 0;
  G.nSquare = 0; G.nMarket = 0; G.nInn = 0; G.nearSquare = 99; G.nearMarket = 99; G.nearInn = 99; G.millOn = false; G.grindOn = false; G.pHunter = null; G.pBarn = null; G.pFarm = null;
  let forestGrid = null, fireList = [], fireN = -1, lanList = [], lanN = -1, ready = false;
  const CELL = 10, HALF = 180, NG = HALF * 2 / CELL;
  const SPACE = id => /cellar|crypt|dungeon|cave|undercroft|tomb|mine|tower|vault/.test(id) ? 'cave' : /chapel|inn|hall|barn|temple|church/.test(id) ? 'hall' : 'room';
  const STONE = /chapel|cellar|crypt|dungeon|cave|undercroft|tomb|tower|vault/;
  const nearestRiver = (x, z, max) => {            // River.dist, but it also keeps the nearest point (no allocation)
    const p = River.p; let best = max * max, bx = 0, bz = 0, at = -1;
    for (const b of River.boxes) { if (x < b[0] - max || x > b[2] + max || z < b[1] - max || z > b[3] + max) continue;
      for (let i = b[4]; i < b[5]; i++) { const ax = p[i][0], az = p[i][1], ex = p[i + 1][0] - ax, ez = p[i + 1][1] - az, l2 = ex * ex + ez * ez, t = l2 ? sat(((x - ax) * ex + (z - az) * ez) / l2) : 0, dx = x - ax - ex * t, dz = z - az - ez * t, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bx = ax + ex * t; bz = az + ez * t; at = River.cum[i] + t * Math.sqrt(l2); } } }
    G.riverX = bx; G.riverZ = bz; G.riverAt = at; return at < 0 ? max : Math.sqrt(best);
  };
  function setup() {
    ready = true; const gy = (x, z) => World.groundY ? World.groundY(x, z) : 0;
    forestGrid = new Uint8Array(NG * NG); const V = World.vegInst || {};
    for (const [k, w] of [['pine', 1], ['birch', 1], ['oak', 3]]) for (const t of V[k] || []) { const i = Math.floor((t[0] + HALF) / CELL), j = Math.floor((t[2] + HALF) / CELL); if (i >= 0 && j >= 0 && i < NG && j < NG) forestGrid[j * NG + i] = Math.min(255, forestGrid[j * NG + i] + w); }
    const inn = typeof SITE !== 'undefined' && SITE.inn; if (inn) { G.innX = inn.x; G.innZ = inn.z; G.innY = gy(inn.x, inn.z) + 1.2; }
    G.sqX = SQUARE.x; G.sqZ = SQUARE.z; G.sqY = gy(SQUARE.x, SQUARE.z) + 1.5; G.mkY = gy(G.mkX, G.mkZ) + 1.5;
    for (const z of World.zones) { if (z.site.id === 'inn') G.innZone = z.id; if (z.site.id === 'mill') G.millZone = z.id; }
    const P = id => { const s = SITE[id]; return s ? [s.x, gy(s.x, s.z) + 1, s.z] : null; }; G.pHunter = P('hunter'); G.pBarn = P('barn'); G.pFarm = P('farm');
    G.lakeY = LAKE.y;
  }
  const forestAt = (x, z) => { const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL); if (i < 1 || j < 1 || i >= NG - 1 || j >= NG - 1) return 0.5; let n = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) n += forestGrid[(j + b) * NG + i + a]; return sat(n / 14); };

  // ── the surface under a foot, at any place ──
  K.surfaceAt = function (x, y, z, zone, inWater) {
    if (zone) { const id = World.zones[zone - 1].site.id; return STONE.test(id) ? 'stone' : 'plank'; }
    if (inWater) return 'water';
    const ty = Terrain.y(x, z); if (y > ty + 0.12) return 'wood';
    if (Terrain.splat(x, z, 1) > 0.4) return 'cobble'; if (Terrain.splat(x, z, 0) > 0.4 || Terrain.splat(x, z, 3) > 0.5) return 'dirt';
    if (World.waterAt(x, z) > -900) return 'water';
    if (nearestRiver(x, z, 9) < 7 || (hyp2(x - LAKE.x, z - LAKE.z) - LAKE.r) < 4) return 'mud';
    return 'grass';
  };

  K.gather = function (dt) {
    if (!ready) { if (typeof World === 'undefined' || !World.zones || !World.vegInst || typeof Player === 'undefined') return; setup(); }
    const cam = R.cam, p = cam.pos, P = Player, f = K.frame;
    G.x = p[0]; G.y = p[1]; G.z = p[2]; G.zone = World.camZone | 0; G.indoor = World.indoor;
    const L = K.L; L.x = p[0]; L.y = p[1]; L.z = p[2]; L.yaw = cam.yaw; L.fx = Math.sin(cam.yaw); L.fz = -Math.cos(cam.yaw); L.rx = Math.cos(cam.yaw); L.rz = Math.sin(cam.yaw);
    G.zid = G.zone ? World.zones[G.zone - 1].site.id : ''; G.space = G.zone ? SPACE(G.zid) : 'open';
    G.hour = Env.hour; G.night = ENV.night; G.day = ENV.day; G.wind = Math.max(0.1, Math.min(1.4, typeof Wind !== 'undefined' ? Wind.feel(Player.pos[0], Player.pos[2]) : ENV.windStrength));      // the gust passing over the player, the same one the grass shows
    G.rain = Math.max(Env.rain || 0, (typeof Sky !== 'undefined' && Sky.weather && Sky.weather.rain) || 0);
    G.playing = !!game.playing; G.menu = !!(typeof UI !== 'undefined' && UI.menu); G.talk = !!(typeof UI !== 'undefined' && (UI.talk || UI.reader)); G.dead = !!(typeof RPG !== 'undefined' && RPG.dead);
    if (K.testHold) return;
    // places that move slowly: re-evaluated a few times a second
    if (tick(1, 4)) {
      G.forest = forestAt(G.x, G.z); G.meadow = sat((hyp2(G.x - SQUARE.x, G.z - SQUARE.z) - 22) / 45) * (1 - 0.6 * G.forest);
      G.riverD = nearestRiver(G.x, G.z, 60); G.riverY = riverY(G.riverAt) + 0.3;
      const dl = hyp2(G.x - LAKE.x, G.z - LAKE.z), lx = dl > 1 ? (G.x - LAKE.x) / dl : 1, lz = dl > 1 ? (G.z - LAKE.z) / dl : 0;
      if (dl > LAKE.r) { G.lakeX = LAKE.x + lx * LAKE.r; G.lakeZ = LAKE.z + lz * LAKE.r; G.lakeD = dl - LAKE.r; } else { G.lakeX = G.x; G.lakeZ = G.z; G.lakeD = 0; } G.lakeY = LAKE.y + 0.2;
      G.nearSquare = hyp2(G.x - G.sqX, G.z - G.sqZ); G.nearMarket = hyp2(G.x - G.mkX, G.z - G.mkZ); G.nearInn = hyp2(G.x - G.innX, G.z - G.innZ);
      if (World.millPos) { G.millOn = true; G.millX = World.millPos[0]; G.millY = World.millPos[1]; G.millZ = World.millPos[2]; }
    }
    if (tick(2, 15) && typeof NPCS !== 'undefined') {
      let a = 0, b = 0, c = 0; for (const n of NPCS) { const q = n.pos; if (hyp2(q[0] - SQUARE.x, q[2] - SQUARE.z) < 17) a++; if (hyp2(q[0] - G.mkX, q[2] - G.mkZ) < 10) b++; if (G.innZone && Math.abs(q[0] - G.innX) < 9 && Math.abs(q[2] - G.innZ) < 7 && World.zoneAt(q[0], q[1] + 1, q[2]) === G.innZone) c++; }
      G.nSquare = a; G.nMarket = b; G.nInn = c;
      const o = NPC.osric; G.grindOn = !!(o && o.anim === 'work' && !o.talking && G.millOn && hyp2(o.pos[0] - G.millX, o.pos[2] - G.millZ) < 9); if (G.millZone) G.grindOn = G.grindOn;
    }
    // fires: the nearest three emitters that burn
    if (World.emitters.length !== fireN) { fireN = World.emitters.length; fireList.length = 0; lanList.length = 0; for (const e of World.emitters) { if (e.type === 'fire' || e.type === 'bonfire' || e.type === 'torch') fireList.push(e); else if (e.type === 'lantern' && !e.zone) lanList.push(e); } }
    if (tick(3, 6)) {
      for (const F of G.fires) F.on = false;
      for (const e of fireList) {
        if (e.type === 'bonfire' && !World.bonfire) continue; const d = Math.sqrt((e.p[0] - G.x) ** 2 + (e.p[1] - G.y) ** 2 + (e.p[2] - G.z) ** 2), big = e.type === 'bonfire', ref = big ? 4 : e.type === 'torch' ? 1.2 : 1.8, max = big ? 70 : 32;
        if (d > max) continue; const lvl = big ? 1.5 : e.type === 'torch' ? 0.3 : Math.min(1.3, 0.5 + (e.size || 0.4)), sc = lvl * ref / Math.max(d, ref) * (e.zone === G.zone ? 1 : 0.3);
        // insert into the three slots by score
        let w = -1, low = sc; for (let i = 0; i < 3; i++) { const F = G.fires[i]; if (!F.on) { w = i; break; } if (F.sc < low) { low = F.sc; w = i; } }
        if (w >= 0) { const F = G.fires[w]; F.on = true; F.sc = sc; F.x = e.p[0]; F.y = e.p[1]; F.z = e.p[2]; F.zone = e.zone | 0; F.ref = ref; F.max = max; F.lvl = lvl; }
      }
      // creak targets: lanterns within 18 m
      G.nLan = 0; G.lanternNear = null; let bd = 18; for (const e of lanList) { const d = hyp2(e.p[0] - G.x, e.p[2] - G.z); if (d < bd) { bd = d; if (!G.lanternNear || Math.random() < 0.5) G.lanternNear = e.p; } }
    }
    const l = typeof NPC !== 'undefined' && NPC.lark, Lk = G.lark; if (l) { Lk.on = !!(l.anim === 'lute' && !l.talking) || Audio2.luteRequest > 0; Lk.x = l.pos[0]; Lk.y = l.pos[1] + 1.2; Lk.z = l.pos[2]; Lk.d = hyp2(l.pos[0] - G.x, l.pos[2] - G.z); if (tick(5, 10)) Lk.zone = World.zoneAt(l.pos[0], l.pos[1] + 1, l.pos[2]); }
  };

  // ── gameplay-driven sound ──
  const q = { step: 0, vy: 0, prevY: 0, prevGround: true, sNext: 0, breathT: 0, heartT: 0, hour: -1, bellN: 0, bellT: 0, k: 0, bellowT: 0, foes: new Map(), placeSeen: 0, steps: 0, npcAcc: new Map() };
  K.q = q; K.lastMat = null;
  K.ups.push(function (K, dt, G) {
    if (!ready || K.testHold) return; const c = K.c, now = K.now(), P = Player;
    const playing = G.playing;
    // ─ the player's feet ─
    if (playing && !P.locked) {
      const fl = Math.floor(P.step);
      if (fl !== q.step) { q.step = fl;
        if (P.speed > 0.4 && P.onGround) {
          let sf = K.surfaceAt(P.pos[0], P.pos[1], P.pos[2], G.zone, P.inWater > 0.15);
          const vy = Math.abs(q.vy); if (P.onGround && vy > 0.45 * P.speed && vy > 0.5) sf = 'stairs';
          K.play('fs.' + sf, null, 1, { w: Math.max(0.55, Math.min(1.5, P.speed / 2.9)) }); K.lastSurface = sf; }
      }
      if (Math.abs(P.pos[1] - q.prevY) > 0.8) q.vy = 0; else q.vy += ((P.pos[1] - q.prevY) / Math.max(dt, 0.001) - q.vy) * Math.min(1, dt * 6); q.prevY = P.pos[1];
      // breath: when stamina is nearly gone, and for a while after
      if (typeof RPG !== 'undefined') { const r = RPG.st(), sta = r.sta / RPG.MAXST, hp = r.hp / RPG.MAXHP;
        q.breathT -= dt; if (q.breathT <= 0 && (sta < 0.34 || RPG.exhausted) && !RPG.dead) { q.breathT = RN(1.2, 1.6); K.play('breath', null, 1, { lo: 1 - sta / 0.34 }); }
        q.heartT -= dt; if (q.heartT <= 0 && hp < 0.3 && hp > 0 && !RPG.dead) { q.heartT = 0.55 + hp * 1.6; K.play('heart', null, 0.5 + (0.3 - hp) * 2.5); } }
    } else q.prevY = P.pos[1];
    // ─ villagers' feet: every stride's worth of distance, quieter, through the spatial route ─
    if (typeof NPCS !== 'undefined' && playing) { let n = 0;
      for (const v of NPCS) { const dx = v.pos[0] - G.x, dz = v.pos[2] - G.z; if (Math.abs(dx) > 16 || Math.abs(dz) > 16) { q.npcAcc.set(v, 0); continue; }
        if (v.anim !== 'walk' && v.anim !== 'run') { q.npcAcc.set(v, 0); continue; }
        let a = (q.npcAcc.get(v) || 0) + (v.anim === 'run' ? 2.7 : 1.35) * dt * 1; const stride = v.anim === 'run' ? 1.25 : 0.8 * v.scale;
        if (a >= stride && n < 4) { a = 0; n++; const zn = K.zoneOf(v.pos[0], v.pos[1], v.pos[2]), sf = K.surfaceAt(v.pos[0], v.pos[1], v.pos[2], zn, false); K.play('fs.' + sf, v.pos, 0.55 * (0.6 + 0.4 * v.scale), { w: 0.9, free: true, zone: zn }); }
        q.npcAcc.set(v, a); } }
    // ─ doors: opening starts the creak, arriving closed is the thunk ─
    if (World.doors && playing) for (const d of World.doors) {
      const o = d.open; if (d._so === undefined) { d._so = o; continue; }
      if (o !== d._so) { const dir = o > d._so ? 1 : -1;
        if (dir === 1 && d._sd !== 1 && d._so < 0.02) { const dd = hyp2(d.c[0] - G.x, d.c[2] - G.z); if (dd < 40) K.play('door.open', d.c, 1, { zone: dd < 7 ? G.zone : 0, free: true }); }
        if (dir === -1 && o < 0.02) { const dd = hyp2(d.c[0] - G.x, d.c[2] - G.z); if (dd < 40) K.play('door.close', d.c, 1, { zone: dd < 7 ? G.zone : 0, free: true }); }
        d._sd = dir; d._so = o; } else if (d._sd) d._sd = 0;
    }
    // ─ the smith: hammer strike in step with his animation, bellows at the forge ─
    const b = typeof NPC !== 'undefined' && NPC.brandt;
    if (b && playing) {
      if (b.anim === 'hammer' && !b.talking) { const k = (b.t * 0.9) % 1; if (q.k < 0.66 && k >= 0.66) { const zn = K.zoneOf(b.pos[0], b.pos[1], b.pos[2]); K.play('anvil', [b.pos[0], b.pos[1] + 0.9, b.pos[2]], RN(0.85, 1.1), { zone: zn, free: true }); } q.k = k; }
      else { q.k = 0; if (b.anim === 'work' && !b.talking) { q.bellowT -= dt; if (q.bellowT <= 0) { q.bellowT = RN(3.5, 6); const zn = K.zoneOf(b.pos[0], b.pos[1], b.pos[2]); K.play('bellows', [b.pos[0] + 1, b.pos[1] + 0.9, b.pos[2]], 1, { zone: zn, free: true }); } } }
    }
    // ─ the mill wheel: a paddle splash twelve times a turn, in step with the visible wheel ─
    const w = World.millWheel; if (w && playing) { const k = Math.floor(w.angle / (Math.PI * 2 / 12)); if (q.wk === undefined) q.wk = k; if (k !== q.wk) { q.wk = k; if (G.millOn) K.play('paddle', [G.millX, G.millY - 1.2, G.millZ], RN(0.7, 1), { zone: 0, free: true }); } }
    // ─ the chapel bell: strokes spaced about three seconds apart; 6 and 12 o'clock count the hour, others strike once ─
    const hr = Math.floor(Env.hour), flags = typeof S !== 'undefined' && S.flags;
    if (hr !== q.hour) { if (q.hour >= 0 && hr === (q.hour + 1) % 24 && flags && flags.bell && playing) { q.bellN = hr === 12 ? 12 : (hr === 6 || hr === 18) ? 6 : 1; q.bellT = now + 0.6; } q.hour = hr; }
    if (q.bellN > 0 && now >= q.bellT && World.bell) { q.bellN--; q.bellT = now + RN(3.1, 3.5); K.play('bell.stroke', World.bell.p, 1, { zone: 0, free: true }); }
    // ─ foes: efforts when a swing starts, grunts when they stagger ─
    if (typeof Foes !== 'undefined' && Foes.list && playing) for (const f of Foes.list) {
      const st = f.alive ? f.state : 'gone', ps = q.foes.get(f); if (ps === undefined) { q.foes.set(f, st); continue; }
      if (st !== ps) { q.foes.set(f, st); const pos = [f.pos[0], f.pos[1] + 1.2, f.pos[2]];
        if (st === 'attack') K.play('foe.effort', pos, 1, { free: true }); else if (st === 'stagger') K.play('foe.hurt', pos, 1, { free: true }); }
    }
    // ─ a place discovered ─
    if (typeof UI !== 'undefined' && UI.placeT !== q.placeSeen) { q.placeSeen = UI.placeT; const pl = document.getElementById('place'); }      // no sound: a jingle at every named place wore thin at once (the banner alone marks a discovery)
  });
  // the lute and the music are in 88c_music.js
  // remember what was last picked up, so the older pickup() call can choose a material
  const MAT = { gold: 'coin', apple: 'food', bread: 'food', ale: 'wood', rope: 'cloth', hammer: 'metal', knife: 'metal', tools: 'metal', frostcap: 'herb', malt: 'cloth', potion: 'generic', tonic: 'generic' };
  K.ups.push(function (K) { if (!K.givePatched && typeof give === 'function') { K.givePatched = true; try { const g0 = give; give = function (id, n) { K.lastMat = MAT[id] || (typeof ITEMS !== 'undefined' && ITEMS[id] && ITEMS[id][2] && ITEMS[id][2].slot ? 'metal' : 'generic'); return g0.apply(this, arguments); }; } catch (e) { } } });
})();
