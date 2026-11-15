// ───────────────────────── mesh builder: 32-byte vertices, transform stack, primitives ─────────────────────────
// vertex: pos f32x3 | normal snorm8x3 + wind snorm8 | uv f32x2 | tint unorm8x3 + skyVis unorm8 | layer, m1, m2, m3 (uint8)
const GRAIN_LAYERS = new Set([MAT.TIMBER, MAT.PLANKS]);
class Mesh {
  constructor(cap = 1024) {
    this.cap = cap; this.icap = cap * 2;
    this.buf = new ArrayBuffer(cap * 32); this.f = new Float32Array(this.buf); this.u8 = new Uint8Array(this.buf); this.i8 = new Int8Array(this.buf);
    this.idx = new Uint32Array(this.icap); this.nv = 0; this.ni = 0;
    this.m = m4.create(); this.st = []; this.nm = new Float32Array(9); this.dirty = true; this.flip = false;
    this.grad = null; this.layer = MAT.PLAIN; this.cr = 255; this.cg = 255; this.cb = 255; this.ao = 1; this.m1 = 0; this.m2 = 0; this.m3 = 0; this.wind = 0; this.tile = 1;
    this.min = [1e9, 1e9, 1e9]; this.max = [-1e9, -1e9, -1e9];
    this.seed = 12345;
  }
  _growV() { const nb = new ArrayBuffer(this.cap * 64); new Uint8Array(nb).set(this.u8); this.cap *= 2; this.buf = nb; this.f = new Float32Array(nb); this.u8 = new Uint8Array(nb); this.i8 = new Int8Array(nb); }
  _growI(n) { while (this.ni + n > this.icap) this.icap *= 2; const ni = new Uint32Array(this.icap); ni.set(this.idx.subarray(0, this.ni)); this.idx = ni; }
  rnd() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) | 0; return (this.seed >>> 8) / 16777216; }
  // ── state ──
  push() { this.st.push(this.m.slice()); return this; }
  pop() { this.m = this.st.pop(); this.dirty = true; return this; }
  T(x, y, z) { m4.translate(this.m, x, y, z); return this; }
  RY(a) { m4.rotY(this.m, a); this.dirty = true; return this; }
  RX(a) { m4.rotX(this.m, a); this.dirty = true; return this; }
  RZ(a) { m4.rotZ(this.m, a); this.dirty = true; return this; }
  S(x, y, z) { m4.scale(this.m, x, y === undefined ? x : y, z === undefined ? x : z); this.dirty = true; return this; }
  // material: layer + tint (sRGB-ish 0..1) ; tileScale multiplies the texture's world size
  mat(layer, col, tileScale) {
    this.layer = layer; this.tile = MAT_TILE[layer] * (tileScale || 1);
    if (col) { this.cr = clamp(col[0] * 255, 0, 255) | 0; this.cg = clamp(col[1] * 255, 0, 255) | 0; this.cb = clamp(col[2] * 255, 0, 255) | 0; }
    else { this.cr = this.cg = this.cb = 255; }
    return this;
  }
  col(c) { this.cr = clamp(c[0] * 255, 0, 255) | 0; this.cg = clamp(c[1] * 255, 0, 255) | 0; this.cb = clamp(c[2] * 255, 0, 255) | 0; return this; }
  _nm() {
    const m = this.m, n = this.nm;
    n[0] = m[5] * m[10] - m[6] * m[9]; n[1] = m[6] * m[8] - m[4] * m[10]; n[2] = m[4] * m[9] - m[5] * m[8];
    n[3] = m[9] * m[2] - m[10] * m[1]; n[4] = m[10] * m[0] - m[8] * m[2]; n[5] = m[8] * m[1] - m[9] * m[0];
    n[6] = m[1] * m[6] - m[2] * m[5]; n[7] = m[2] * m[4] - m[0] * m[6]; n[8] = m[0] * m[5] - m[1] * m[4];
    const det = m[0] * n[0] + m[1] * n[1] + m[2] * n[2];
    this.flip = det < 0; if (this.flip) for (let i = 0; i < 9; i++) n[i] = -n[i];
    this.dirty = false;
  }
  vert(x, y, z, nx, ny, nz, u, v, ao) {
    if (this.nv >= this.cap) this._growV();
    if (this.dirty) this._nm();
    const m = this.m, n = this.nm, i = this.nv++, o = i * 8, b = i * 32, f = this.f, i8 = this.i8, u8 = this.u8;
    const px = m[0] * x + m[4] * y + m[8] * z + m[12], py = m[1] * x + m[5] * y + m[9] * z + m[13], pz = m[2] * x + m[6] * y + m[10] * z + m[14];
    let ax = n[0] * nx + n[3] * ny + n[6] * nz, ay = n[1] * nx + n[4] * ny + n[7] * nz, az = n[2] * nx + n[5] * ny + n[8] * nz;
    const l = 127 / (Math.sqrt(ax * ax + ay * ay + az * az) || 1);
    f[o] = px; f[o + 1] = py; f[o + 2] = pz;
    i8[b + 12] = Math.round(ax * l); i8[b + 13] = Math.round(ay * l); i8[b + 14] = Math.round(az * l); i8[b + 15] = Math.round(this.wind * 127);
    f[o + 4] = u; f[o + 5] = v;
    u8[b + 24] = this.cr; u8[b + 25] = this.cg; u8[b + 26] = this.cb;
    const a = this.ao * (ao === undefined ? 1 : ao); u8[b + 27] = a >= 1 ? 255 : a <= 0 ? 0 : (a * 255) | 0;
    u8[b + 28] = this.layer; u8[b + 29] = this.m1; u8[b + 30] = this.m2; u8[b + 31] = this.m3;
    const mn = this.min, mx = this.max;
    if (px < mn[0]) mn[0] = px; if (py < mn[1]) mn[1] = py; if (pz < mn[2]) mn[2] = pz;
    if (px > mx[0]) mx[0] = px; if (py > mx[1]) mx[1] = py; if (pz > mx[2]) mx[2] = pz;
    return i;
  }
  tri(a, b, c) { if (this.ni + 3 > this.icap) this._growI(3); const x = this.idx; if (this.flip) { x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = b; } else { x[this.ni++] = a; x[this.ni++] = b; x[this.ni++] = c; } }
  // flat quad, corners given top-left, bottom-left, bottom-right, top-right as seen from the front
  quad(tl, bl, br, tr, u0, v0, u1, v1, swap) {
    const ex = bl[0] - tl[0], ey = bl[1] - tl[1], ez = bl[2] - tl[2], fx = tr[0] - tl[0], fy = tr[1] - tl[1], fz = tr[2] - tl[2];
    const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
    if (u0 === undefined) { u0 = this.rnd() * 4; v0 = this.rnd() * 4; }
    if (u1 === undefined) { const w = hyp(fx, fy, fz) / this.tile, h = hyp(ex, ey, ez) / this.tile; if (swap) { u1 = u0 + h; v1 = v0 + w; } else { u1 = u0 + w; v1 = v0 + h; } }
    let a, b, c, d; const gt = this.grad ? this.grad[0] : 1, gb = this.grad ? this.grad[1] : 1;
    if (swap) {        // texture U runs along the vertical edge
      a = this.vert(tl[0], tl[1], tl[2], nx, ny, nz, u0, v0, gt); b = this.vert(bl[0], bl[1], bl[2], nx, ny, nz, u1, v0, gb);
      c = this.vert(br[0], br[1], br[2], nx, ny, nz, u1, v1, gb); d = this.vert(tr[0], tr[1], tr[2], nx, ny, nz, u0, v1, gt);
    } else {
      a = this.vert(tl[0], tl[1], tl[2], nx, ny, nz, u0, v0, gt); b = this.vert(bl[0], bl[1], bl[2], nx, ny, nz, u0, v1, gb);
      c = this.vert(br[0], br[1], br[2], nx, ny, nz, u1, v1, gb); d = this.vert(tr[0], tr[1], tr[2], nx, ny, nz, u1, v0, gt);
    }
    this.tri(a, b, c); this.tri(a, c, d);
    return this;
  }
  // double-sided quad
  quad2(tl, bl, br, tr, u0, v0, u1, v1) { this.quad(tl, bl, br, tr, u0, v0, u1, v1); this.quad(tr, br, bl, tl, u1, v0, u0, v1); return this; }
  // axis-aligned box from min to max corner (local space). skip = bitmask of faces to omit: 1 -X, 2 +X, 4 -Y, 8 +Y, 16 -Z, 32 +Z
  box(x0, y0, z0, x1, y1, z1, skip) {
    skip = skip | 0;
    const g = GRAIN_LAYERS.has(this.layer), dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    if (!(skip & 2)) this.quad([x1, y1, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], undefined, undefined, undefined, undefined, g && dy > dz);
    if (!(skip & 1)) this.quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], undefined, undefined, undefined, undefined, g && dy > dz);
    if (!(skip & 32)) this.quad([x0, y1, z1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], undefined, undefined, undefined, undefined, g && dy > dx);
    if (!(skip & 16)) this.quad([x1, y1, z0], [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], undefined, undefined, undefined, undefined, g && dy > dx);
    if (!(skip & 8)) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], undefined, undefined, undefined, undefined, g && dz > dx);
    if (!(skip & 4)) this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], undefined, undefined, undefined, undefined, g && dz > dx);
    return this;
  }
  // box centred on (x,z) sitting on y
  cbox(x, y, z, w, h, d, skip) { return this.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, skip); }
  // oriented beam from p0 to p1 with cross-section w (sideways) x h (up-ish)
  beam(p0, p1, w, h, skip) {
    const ax = v3.sub(p1, p0), L = v3.len(ax); if (L < 1e-5) return this;
    const z = v3.scale(ax, 1 / L), up = Math.abs(z[1]) > 0.985 ? [1, 0, 0] : [0, 1, 0];
    const x = v3.norm(v3.cross(up, z)), y = v3.cross(z, x);
    this.push(); const b = m4.create(); m4.basis(b, x, y, z, p0); m4.mul(this.m, this.m, b); this.dirty = true;
    this.box(-w / 2, -h / 2, 0, w / 2, h / 2, L, skip);
    return this.pop();
  }
  // parametric grid of shared vertices; fn(i, j) must call vert() once and return its index
  grid(cols, rows, fn) {
    const base = this.nv;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) fn(i, j);
    // decide winding from the first non-degenerate cell
    let flipW = false;
    const f = this.f, i8 = this.i8, W = cols + 1;
    outer: for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = base + j * W + i, b = a + W, c = b + 1;
      const ex = f[b * 8] - f[a * 8], ey = f[b * 8 + 1] - f[a * 8 + 1], ez = f[b * 8 + 2] - f[a * 8 + 2];
      const gx = f[c * 8] - f[a * 8], gy = f[c * 8 + 1] - f[a * 8 + 1], gz = f[c * 8 + 2] - f[a * 8 + 2];
      const nx = ey * gz - ez * gy, ny = ez * gx - ex * gz, nz = ex * gy - ey * gx;
      if (nx * nx + ny * ny + nz * nz < 1e-12) continue;
      const d = nx * i8[a * 32 + 12] + ny * i8[a * 32 + 13] + nz * i8[a * 32 + 14];
      flipW = d < 0; break outer;
    }
    if (this.ni + cols * rows * 6 > this.icap) this._growI(cols * rows * 6);
    const x = this.idx;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = base + j * W + i, b = a + W, c = b + 1, d = a + 1;
      if (flipW) { x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = b; x[this.ni++] = a; x[this.ni++] = d; x[this.ni++] = c; }
      else { x[this.ni++] = a; x[this.ni++] = b; x[this.ni++] = c; x[this.ni++] = a; x[this.ni++] = c; x[this.ni++] = d; }
    }
    return this;
  }
  // surface of revolution about +Y. profile = [[r, y], ...] bottom to top. caps: 1 bottom, 2 top
  lathe(prof, n, caps) {
    const np = prof.length, circ = TAU * Math.max(...prof.map(p => p[0]));
    const uo = this.rnd() * 3, vo = this.rnd() * 3; let len = 0; const acc = [0];
    for (let k = 1; k < np; k++) { len += hyp(prof[k][0] - prof[k - 1][0], prof[k][1] - prof[k - 1][1]); acc.push(len); }
    this.grid(n, np - 1, (i, j) => {
      const k = np - 1 - j, a = -i / n * TAU, p = prof[k], pa = prof[Math.max(k - 1, 0)], pb = prof[Math.min(k + 1, np - 1)];
      const tr = pb[0] - pa[0], ty = pb[1] - pa[1];           // tangent in (r,y); normal = (ty, -tr)
      const c = Math.cos(a), s = Math.sin(a);
      return this.vert(p[0] * c, p[1], p[0] * s, ty * c, -tr, ty * s, uo + i / n * circ / this.tile, vo + (len - acc[k]) / this.tile);
    });
    caps = caps | 0;
    if (caps & 2) this.disc(0, prof[np - 1][1], 0, prof[np - 1][0], n, 1);
    if (caps & 1) this.disc(0, prof[0][1], 0, prof[0][0], n, -1);
    return this;
  }
  cyl(x, y, z, r0, r1, h, n, caps) { this.push().T(x, y, z); this.lathe([[r0, 0], [r1, h]], n, caps === undefined ? 2 : caps); return this.pop(); }
  disc(x, y, z, r, n, dir) {
    const c = this.vert(x, y, z, 0, dir, 0, 0.5 * r / this.tile, 0.5 * r / this.tile); let prev = -1, first = -1;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
      const v = this.vert(x + cx, y, z + cz, 0, dir, 0, (cx + r * 0.5) / this.tile, (cz + r * 0.5) / this.tile);
      if (prev >= 0) { if (dir > 0) this.tri(c, v, prev); else this.tri(c, prev, v); } else first = v;
      prev = v;
    }
    if (dir > 0) this.tri(c, first, prev); else this.tri(c, prev, first);
    return this;
  }
  // ellipsoid
  ball(x, y, z, rx, ry, rz, nu, nv) {
    nu = nu || 10; nv = nv || 6; if (ry === undefined) { ry = rx; rz = rx; }
    return this.grid(nu, nv, (i, j) => {
      const a = -i / nu * TAU, b = j / nv * PI, sb = Math.sin(b), cb = Math.cos(b), ca = Math.cos(a), sa = Math.sin(a);
      return this.vert(x + rx * sb * ca, y + ry * cb, z + rz * sb * sa, sb * ca / rx, cb / ry, sb * sa / rz, i / nu * 2, j / nv);
    });
  }
  // tube along a polyline of [x,y,z] with per-point radii
  tube(pts, radii, n, capEnds) {
    const N = pts.length, frames = []; let prevX = null, len = 0; const acc = [0];
    for (let k = 0; k < N; k++) {
      const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, N - 1)];
      const t = v3.norm(v3.sub(b, a));
      let x = prevX ? v3.sub(prevX, v3.scale(t, v3.dot(prevX, t))) : v3.cross(Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], t);
      x = v3.norm(x); const y = v3.cross(t, x); prevX = x; frames.push([x, y]);
      if (k > 0) { len += v3.len(v3.sub(pts[k], pts[k - 1])); acc.push(len); }
    }
    const rad = k => typeof radii === 'number' ? radii : radii[k];
    const uo = this.rnd() * 3;
    this.grid(n, N - 1, (i, j) => {
      const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a), fr = frames[j], p = pts[j], r = rad(j);
      const nx = fr[0][0] * c + fr[1][0] * s, ny = fr[0][1] * c + fr[1][1] * s, nz = fr[0][2] * c + fr[1][2] * s;
      return this.vert(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, uo + i / n * TAU * rad(0) / this.tile, acc[j] / this.tile);
    });
    if (capEnds) { for (const k of [0, N - 1]) { const p = pts[k], r = rad(k), fr = frames[k], sgn = k ? 1 : -1; const t = v3.scale(v3.cross(fr[0], fr[1]), sgn);
      const c = this.vert(p[0], p[1], p[2], t[0], t[1], t[2], 0, 0); const ring = [];
      for (let i = 0; i < n; i++) { const a = i / n * TAU, cs = Math.cos(a), sn = Math.sin(a); ring.push(this.vert(p[0] + (fr[0][0] * cs + fr[1][0] * sn) * r, p[1] + (fr[0][1] * cs + fr[1][1] * sn) * r, p[2] + (fr[0][2] * cs + fr[1][2] * sn) * r, t[0], t[1], t[2], cs * r / this.tile, sn * r / this.tile)); }
      for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; if (sgn > 0) this.tri(c, a, b); else this.tri(c, b, a); } } }
    return this;
  }
  // convex polygon fan (points CCW from the front), planar UVs from the first edge
  poly(pts) {
    const a = pts[0], e = v3.norm(v3.sub(pts[1], a)), n = v3.norm(v3.cross(v3.sub(pts[1], a), v3.sub(pts[pts.length - 1], a))), f = v3.cross(n, e);
    const uo = this.rnd() * 3, vo = this.rnd() * 3;
    const ids = pts.map(p => { const d = v3.sub(p, a); return this.vert(p[0], p[1], p[2], n[0], n[1], n[2], uo + v3.dot(d, e) / this.tile, vo - v3.dot(d, f) / this.tile); });
    for (let i = 1; i < ids.length - 1; i++) this.tri(ids[0], ids[i], ids[i + 1]);
    return this;
  }
  get bytes() { return this.u8.subarray(0, this.nv * 32); }
  get indices() { return this.idx.subarray(0, this.ni); }
  center() { return [(this.min[0] + this.max[0]) / 2, (this.min[1] + this.max[1]) / 2, (this.min[2] + this.max[2]) / 2]; }
  radius() { return 0.5 * hyp(this.max[0] - this.min[0], this.max[1] - this.min[1], this.max[2] - this.min[2]); }
}
// packs many meshes into one vertex + one index buffer; returns ranges
class MeshPack {
  constructor() { this.items = []; this.nv = 0; this.ni = 0; }
  add(mesh, extra) {
    const it = Object.assign({ first: this.ni, count: mesh.ni, base: this.nv, mesh, c: mesh.center(), r: mesh.radius() }, extra || {});
    this.items.push(it); this.nv += mesh.nv; this.ni += mesh.ni; return it;
  }
  // de-interleaves the 32-byte vertices into attributes every item's geometry shares; indices become absolute
  upload(label) {
    const nv = Math.max(this.nv, 1), pos = new Float32Array(nv * 3), nrm = new Int8Array(nv * 4), uv = new Float32Array(nv * 2), tint = new Uint8Array(nv * 4), mm = new Uint8Array(nv * 4), wind = new Float32Array(nv);
    const ix = new Uint32Array(Math.max(this.ni, 3));
    for (const it of this.items) {
      const m = it.mesh, f = m.f, u8 = m.u8, i8 = m.i8, b0 = it.base;
      for (let v = 0; v < m.nv; v++) {
        const o = v * 8, b = v * 32, d = b0 + v;
        pos[d * 3] = f[o]; pos[d * 3 + 1] = f[o + 1]; pos[d * 3 + 2] = f[o + 2];
        nrm[d * 4] = i8[b + 12]; nrm[d * 4 + 1] = i8[b + 13]; nrm[d * 4 + 2] = i8[b + 14]; wind[d] = Math.max(i8[b + 15], 0) / 127;
        uv[d * 2] = f[o + 4]; uv[d * 2 + 1] = f[o + 5];
        tint[d * 4] = u8[b + 24]; tint[d * 4 + 1] = u8[b + 25]; tint[d * 4 + 2] = u8[b + 26]; tint[d * 4 + 3] = u8[b + 27];
        mm[d * 4] = u8[b + 28]; mm[d * 4 + 1] = u8[b + 29]; mm[d * 4 + 2] = u8[b + 30]; mm[d * 4 + 3] = u8[b + 31];
      }
      const src = m.indices; for (let k = 0; k < src.length; k++) ix[it.first + k] = src[k] + b0;
      it.mesh = null;
    }
    const BA = THREE.BufferAttribute;
    this.attr = { position: new BA(pos, 3), normal: new BA(nrm, 4, true), uv: new BA(uv, 2), tint: new BA(tint, 4, true), mm: new BA(mm, 4, true), wind: new BA(wind, 1) };
    this.index = new BA(ix, 1); this.label = label;
    this.tris = this.ni / 3;
    return this;
  }
}
