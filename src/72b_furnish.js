// ───────────────────────── interior dressing additions: contact shadows under furniture (more to come) ─────────────────────────
// Soft dark pads on the floor under every ground-standing kit piece of a room, merged into one transparent mesh per room (one draw call).
const FURN = { blobs: {} };
function furnBlob(zone, P) {
  const pc = Kit.pieces[P.name], zi = World.zones[zone - 1]; if (!pc || !zi) return;
  const sx = pc.max[0] - pc.min[0], sy = pc.max[1] - pc.min[1], sz = pc.max[2] - pc.min[2]; if (sx * sz < 0.1 || sy < 0.12) return;
  const e = P.M.elements, fy = zi.y0 + 0.7;
  const cx = (pc.min[0] + pc.max[0]) / 2, cz = (pc.min[2] + pc.max[2]) / 2;
  const wx = e[0] * cx + e[4] * pc.min[1] + e[8] * cz + e[12], wy = e[1] * cx + e[5] * pc.min[1] + e[9] * cz + e[13], wz = e[2] * cx + e[6] * pc.min[1] + e[10] * cz + e[14];
  if (wy < fy - 0.3 || wy > fy + 0.45) return;
  const ax = Math.hypot(e[0], e[2]) || 1, az = Math.hypot(e[8], e[10]) || 1, mg = 0.16;
  const hx = sx / 2 * ax + mg, hz = sz / 2 * az + mg, ux = [e[0] / ax, e[2] / ax], uz = [e[8] / az, e[10] / az];
  (FURN.blobs[zone] = FURN.blobs[zone] || []).push([wx, fy + 0.034, wz, hx * ux[0], hx * ux[1], hz * uz[0], hz * uz[1]]);
}
function furnBlobs(zone, group) {
  const L = FURN.blobs[zone]; if (!L || !L.length) return;
  const pos = new Float32Array(L.length * 12), uvs = new Float32Array(L.length * 8), idx = new Uint16Array(L.length * 6);
  L.forEach((b, i) => {
    const c = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
    c.forEach((k, j) => { const o = i * 4 + j; pos[o * 3] = b[0] + k[0] * b[3] + k[1] * b[5]; pos[o * 3 + 1] = b[1]; pos[o * 3 + 2] = b[2] + k[0] * b[4] + k[1] * b[6]; uvs[o * 2] = k[2]; uvs[o * 2 + 1] = k[3]; });
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingBox(); g.computeBoundingSphere();
  if (!FURN.mat) {
    const { vec3, uv, abs, max, smoothstep, float } = TSL, m = FURN.mat = new THREE.MeshBasicNodeMaterial(), d = max(abs(uv().x.sub(0.5)), abs(uv().y.sub(0.5))).mul(2);
    m.colorNode = vec3(0.012, 0.008, 0.006); m.opacityNode = smoothstep(1.0, 0.4, d).mul(0.62); m.transparent = true; m.depthWrite = false; m.fog = false; m.side = THREE.DoubleSide;
    m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  }
  const mesh = new THREE.Mesh(g, FURN.mat); mesh.matrixAutoUpdate = false; mesh.name = 'floor-shadows'; mesh.castShadow = false; mesh.receiveShadow = false; group.add(mesh);
}
