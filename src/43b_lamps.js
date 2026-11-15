// ───────────────────────── lamp map: the pool of light each street lantern throws on the ground ─────────────────────────
// Only the few nearest lights are real point lights (R.q.lights). Every lantern still needs its pool, near or far, so the ground
// term of all outdoor lanterns is baked once into one small texture over the terrain square (the same mapping as the splat maps) and
// the terrain reads it with a single sample. Houses block it: a lantern does not light the lane behind its own building.
// Lights baked here are flagged (l.baked) so the terrain does not also add them as real lights.
const Lamps = { N: 640, count: -1, tex: null };
Lamps.init = function () {
  const N = Lamps.N, d = Lamps.data = new Uint8Array(N * N);
  const t = Lamps.tex = new THREE.DataTexture(d, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  G.lampTex = t;
};
// called every frame; rebakes only when lanterns were added (places outside the village attach theirs after the first build)
Lamps.sync = function () {
  if (!Lamps.tex || World.emitters.length === Lamps.count) return;
  Lamps.count = World.emitters.length;
  const N = Lamps.N, TH = K.terrainHalf, cell = 2 * TH / N, acc = new Float32Array(N * N), R_ = 9, H = 2.2;
  const lamps = World.emitters.filter(e => e.type === 'lantern' && !e.zone && Math.abs(e.p[0]) < TH - R_ && Math.abs(e.p[2]) < TH - R_);
  const houses = SITES.concat(typeof INF !== 'undefined' ? INF.houses : []).filter(s => s && s.w && s.d);
  for (const l of World.lights) if (l.kind === 'lantern' && !l.zone && lamps.some(e => hyp(e.p[0] - l.p[0], e.p[2] - l.p[2]) < 0.6)) l.baked = true;
  // does the straight line from the lamp to a point on the ground pass through a house? (2D, footprints drawn in a little so a lamp on a wall is outside its own)
  const blockers = (x, z) => houses.filter(s => hyp(s.x - x, s.z - z) < R_ + 0.75 * Math.max(s.w, s.d)).map(s => ({ s, a: worldToSite(s, x, z), hw: s.w / 2 - 0.45, hd: s.d / 2 - 0.45 }));
  const cut = (b, x, z) => {
    const q = worldToSite(b.s, x, z), ax = b.a[0], az = b.a[1], dx = q[0] - ax, dz = q[1] - az; let t0 = 0, t1 = 1;
    for (const [o, d, h] of [[ax, dx, b.hw], [az, dz, b.hd]]) {
      if (Math.abs(d) < 1e-9) { if (Math.abs(o) > h) return false; continue; }
      let u0 = (-h - o) / d, u1 = (h - o) / d; if (u0 > u1) { const t = u0; u0 = u1; u1 = t; }
      t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) return false;
    }
    return true;
  };
  for (const e of lamps) {
    const lx = e.p[0], lz = e.p[2], gy = World.groundY ? World.groundY(lx, lz) : Terrain.y(lx, lz), h = clamp(e.p[1] - gy, 1.2, 4), B = blockers(lx, lz);
    const i0 = Math.floor((lx - R_ + TH) / cell), i1 = Math.ceil((lx + R_ + TH) / cell), j0 = Math.floor((lz - R_ + TH) / cell), j1 = Math.ceil((lz + R_ + TH) / cell);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = (i + 0.5) * cell - TH, z = (j + 0.5) * cell - TH, d2 = (x - lx) * (x - lx) + (z - lz) * (z - lz) + h * h; if (d2 >= R_ * R_) continue;
      let hit = false; for (const b of B) if (cut(b, x, z)) { hit = true; break; } if (hit) continue;
      const f = 1 - d2 / (R_ * R_), ndl = (h / Math.sqrt(d2) + 0.25) / 1.25;        // the same falloff as SH.pointLights, for ground facing up
      acc[j * N + i] += 3.4 * f * f / (d2 * 0.55 + 1) * ndl;
    }
  }
  // soften the hard edge the footprint test leaves, then store the square root (the shader squares it) so dim edges keep their steps
  const d = Lamps.data, pk = SH.LAMP_PEAK;
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const o = j * N + i, v = (acc[o] * 4 + acc[o - 1] + acc[o + 1] + acc[o - N] + acc[o + N]) / 8; d[o] = Math.min(255, Math.round(Math.sqrt(Math.min(v / pk, 1)) * 255)); }
  Lamps.tex.needsUpdate = true; Lamps.lamps = lamps.length;
};
