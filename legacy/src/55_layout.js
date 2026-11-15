// ───────────────────────── Brackenfell: where everything is ─────────────────────────
// x = east, z = south, y = up. A site's "front" (its door wall) faces heading `yaw` (0 = north, clockwise).
const LAKE = { x: 10, z: 122, r: 34, y: -1.6 };
const SITES = [
  { id: 'inn', name: 'The Honeyed Hart', x: 0, z: -22, yaw: PI, w: 15, d: 9.6 },
  { id: 'smithy', name: 'Brandt’s Forge', x: -23, z: -13, yaw: PI / 2, w: 9.5, d: 7, doorPos: 3.0, bare: [[-5.0, -7.1, 1.8, -3.4]] },
  { id: 'store', name: 'Quill’s Sundries', x: 23, z: -8.5, yaw: -PI / 2, w: 8.4, d: 6.6, doorPos: -1.9 },
  { id: 'elder', name: 'Rowan’s Cottage', x: -18, z: 20, yaw: PI * 0.25, w: 7.2, d: 5.6, doorPos: 0.9 },
  { id: 'herbalist', name: 'Maren’s Cottage', x: 18, z: 22, yaw: -PI * 0.25, w: 6.6, d: 5.6, doorPos: -0.9 },
  { id: 'guardhouse', name: 'Warden’s Lodge', x: -41, z: -15.5, yaw: PI, w: 7.2, d: 5.6, doorPos: 0.9 },
  { id: 'weaver', name: 'Riverside Cottage', x: 38, z: 11, yaw: 0, w: 7.6, d: 6, doorPos: 0.9 },
  { id: 'chapel', name: 'Chapel of the Dawn', x: -6, z: -75, yaw: -PI / 2, w: 14, d: 8, doorWall: 'left', doorPos: 0, pad: 4.4, porch: 3.4, bare: [[-10.9, -2.4, -6.9, 2.4]] },
  { id: 'mill', name: 'Dunn’s Mill', x: 66.6, z: 26, yaw: PI / 2, w: 7.4, d: 6.4, doorWall: 'left', doorPos: -0.6 },
  { id: 'farm', name: 'Fairweather Farm', x: 98, z: -22, yaw: PI * 0.85, w: 8, d: 6, doorPos: 1.0 },
  { id: 'barn', name: 'Barn', x: 113, z: -3, yaw: -PI / 2, w: 9, d: 7.5, pad: 2 },
  { id: 'hunter', name: 'Wren’s Cabin', x: -72, z: 44, yaw: PI / 2, w: 6.2, d: 5.2, doorPos: 0.8 },
  { id: 'fisher', name: 'Fisher’s Hut', x: -9, z: 82, yaw: PI * 0.62, w: 5.2, d: 4.6, doorPos: 0.6 },
  { id: 'tower', name: 'Old Watchtower', x: 26, z: -124, yaw: PI * 0.9, w: 9, d: 9, pad: 3 },
];
const SITE = {}; for (const s of SITES) SITE[s.id] = s;
const siteToWorld = (s, lx, lz) => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw); return [s.x + lx * c - lz * sn, s.z + lx * sn + lz * c]; };
const worldToSite = (s, x, z) => { const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), dx = x - s.x, dz = z - s.z; return [dx * c + dz * sn, -dx * sn + dz * c]; };

const RIVER_PTS = [[70, -330], [64, -250], [58, -190], [47, -150], [52, -100], [60, -55], [59, -20], [58, 2], [60, 28], [53, 58], [38, 82], [25, 98], [18, 106]];
const BRIDGE = { x: 58, z: 2, len: 15, w: 4.2 };       // spans east-west
const FIELDS = [{ x0: 82, z0: 10, x1: 104, z1: 30 }, { x0: 107, z0: 12, x1: 126, z1: 36 }, { x0: 84, z0: 34, x1: 103, z1: 50 }];
const ROADS = [
  { id: 'main', w: 3.4, pts: [[-170, 4], [-128, -7], [-95, -7], [-62, -5], [-34, -3.5], [-13, -1], [13, 0], [36, 1], [50, 2], [66, 2], [78, 0], [98, -9], [124, -13], [165, -18]] },
  { id: 'north', w: 2.5, pts: [[-10, -8], [-13.5, -22], [-14.5, -38], [-11, -52], [-6.5, -60], [-6, -64.2]] },
  { id: 'crag', w: 1.5, pts: [[-6.5, -60], [3, -64], [11, -77], [14, -93], [15, -106], [19, -116], [24, -119.5]] },
  { id: 'south', w: 2.5, pts: [[0, 11], [-1.5, 30], [1.5, 50], [3.5, 68], [5, 80], [6.6, 87.5]] },
  { id: 'mill', w: 1.7, pts: [[66.5, 2.6], [67.2, 10], [66.8, 20.6]] },
  { id: 'farm', w: 1.9, pts: [[97, -8.6], [99, -14], [100.2, -17.4]] },
  { id: 'barn', w: 1.9, pts: [[101, -10], [106, -5], [107.6, -3]] },
  { id: 'hunter', w: 1.3, pts: [[-62, -4.5], [-63, 10], [-67, 28], [-68.5, 40], [-67.6, 44]] },
  { id: 'fisher', w: 1.3, pts: [[3.5, 70], [-1, 77], [-5.4, 82.2]] },
];
const WORLD_RADIUS = 136;       // how far the player may wander from the square
const SQUARE = { x: 0, z: -2, rx: 15.5, rz: 14 };
// a point `dist` metres outside a site's main door, in site-local coordinates
function siteDoorLocal(s, dist) {
  const wall = s.doorWall || 'front', p = s.doorPos || 0, e = dist + (s.porch || 0);
  return wall === 'front' ? [p, -s.d / 2 - e] : wall === 'back' ? [p, s.d / 2 + e] : wall === 'left' ? [-s.w / 2 - e, p] : [s.w / 2 + e, p];
}
