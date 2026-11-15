// A hand-assembled sample: two-storey house, 6 m (x) by 8 m (z), from the village kit, furnished from the props kit.
// Kit rules used here: wall modules are 2 m wide, 3 m per storey, pivot at the bottom centre, outside face = local +z.
// So a wall on the +z side needs no turn, -z: ry = PI, +x: ry = PI/2, -x: ry = -PI/2. Roofs sit on the wall tops, ridge along z.
function sampleHouse(b, ox, oy, oz, zone) {
  const PI = Math.PI, W = 3, D = 4;          // half footprint
  const out = { zone: 0, skyVis: 1, inZone: zone, inSkyVis: 0.3 }, ins = { zone, skyVis: 0.3 }, ext = { zone: 0, skyVis: 1 };
  const at = (n, x, y, z, ry, o, s) => b.add(n, { p: [ox + x, oy + y, oz + z], ry: ry || 0, s: s === undefined ? 1 : s }, o || ext);
  const sides = [                          // [x(u), z(u), ry, count]: u runs along the wall
    { n: 3, ry: 0, pos: u => [u, D] }, { n: 3, ry: PI, pos: u => [-u, -D] }, { n: 4, ry: PI / 2, pos: u => [W, -u] }, { n: 4, ry: -PI / 2, pos: u => [-W, u] }];
  const G0 = [['Wall_UnevenBrick_Window_Wide_Flat', 'Wall_UnevenBrick_Door_Round', 'Wall_UnevenBrick_Window_Wide_Flat'], ['Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Thin_Round', 'Wall_UnevenBrick_Straight'],
    ['Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Wide_Round', 'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Thin_Round'], ['Wall_UnevenBrick_Window_Thin_Round', 'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Straight']];
  const G1 = [['Wall_Plaster_Straight_L', 'Wall_Plaster_Door_Flat', 'Wall_Plaster_Straight_R'], ['Wall_Plaster_WoodGrid', 'Wall_Plaster_Window_Wide_Flat2', 'Wall_Plaster_WoodGrid'],
    ['Wall_Plaster_Straight_L', 'Wall_Plaster_Window_Wide_Flat', 'Wall_Plaster_WoodGrid', 'Wall_Plaster_Straight_R'], ['Wall_Plaster_Straight_L', 'Wall_Plaster_WoodGrid', 'Wall_Plaster_Window_Thin_Round', 'Wall_Plaster_Straight_R']];
  const fit = { Wall_UnevenBrick_Window_Wide_Flat: ['Window_Wide_Flat1', 'WindowShutters_Wide_Flat_Open'], Wall_UnevenBrick_Window_Thin_Round: ['Window_Thin_Round1', 'WindowShutters_Thin_Round_Open'], Wall_UnevenBrick_Window_Wide_Round: ['Window_Wide_Round1', 'WindowShutters_Wide_Round_Open'],
    Wall_Plaster_Window_Wide_Flat: ['Window_Wide_Flat1', 'WindowShutters_Wide_Flat_Open'], Wall_Plaster_Window_Wide_Flat2: ['Window_Wide_Flat1'], Wall_Plaster_Window_Thin_Round: ['Window_Thin_Round1', 'WindowShutters_Thin_Round_Closed'],
    Wall_UnevenBrick_Door_Round: ['DoorFrame_Round_Brick'], Wall_Plaster_Door_Flat: ['DoorFrame_Flat_WoodDark'] };
  [G0, G1].forEach((rows, storey) => sides.forEach((s, si) => {
    for (let k = 0; k < s.n; k++) {
      const u = (k - (s.n - 1) / 2) * 2, [x, z] = s.pos(u), name = rows[si][k];
      at(name, x, storey * 3, z, s.ry, out);
      for (const extra of fit[name] || []) at(extra, x, storey * 3, z, s.ry, out);
    }
  }));
  // doors hang on their hinge (local x 0 .. 1.07): front door ajar, balcony door shut
  at('Door_8_Round', -0.54, 0, D - 0.05, 0.9, out); at('Door_1_Flat', -0.54, 3, D - 0.05, 0, out);
  for (const [cx, cz, ry] of [[W, D, 0], [-W, D, -PI / 2], [-W, -D, PI], [W, -D, PI / 2]]) { at('Corner_Exterior_Brick', cx, 0, cz, ry, ext); at('Corner_Exterior_Wood', cx, 3, cz, ry, ext); }
  // floors: flagstones below, boards above with a stair well along the -x wall
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
    const x = (i - 1) * 2, z = (j - 1.5) * 2;
    at('Floor_Brick', x, 0.01, z, 0, ins);
    if (!(i === 0 && (j === 1 || j === 2))) at('Floor_WoodDark', x, 3, z, 0, ins);
  }
  at('Stair_Interior_Simple', -2.1, 0, 2.3, 0, ins);
  // roof with its two timber gables, a chimney, and a small balcony over the door
  at('Roof_RoundTiles_6x8', 0, 6, 0, 0, { zone: 0, skyVis: 1, inZone: zone, inSkyVis: 0.2 }); at('Roof_Front_Brick6', 0, 6, D, 0, out); at('Roof_Front_Brick6', 0, 6, -D, PI, out);
  at('Prop_Chimney', 1.6, 7.2, -1.8, 0, ext);
  at('Balcony_Simple_Corner', 1, 3, D, 0, ext); b.add('Balcony_Simple_Corner', { p: [ox - 1, oy + 3, oz + D], s: [-1, 1, 1] }, ext);
  at('Floor_WoodDark_Half3', -1, 3, D + 1, 0, ext); at('Floor_WoodDark_Half3', 1, 3, D + 1, 0, ext);
  at('Prop_Vine1', W + 0.12, 2.2, 1.2, PI / 2, ext); at('Prop_Vine5', -1.9, 2.6, D + 0.12, 0, ext);
  // ── the room downstairs ──
  const lights = [];
  at('Table_Large', 0.6, 0.02, -0.6, PI / 2, ins); at('Chair_1', -0.5, 0.02, -0.2, PI / 2, ins); at('Chair_1', 1.7, 0.02, -1.0, -PI / 2, ins); at('Stool', 0.5, 0.02, 1.0, 0.3, ins); at('Bench', 0.7, 0.02, -2.3, 0, ins);
  at('Bookcase_2', 2.55, 0.02, -3.2, -PI / 2, ins); at('Cabinet', -1.2, 0.02, -3.55, 0, ins); at('Bed_Twin1', 1.9, 0.02, 2.6, PI, ins); at('Nightstand_Shelf', 0.6, 0.02, 3.5, 0, ins);
  at('Barrel', -2.4, 0.02, -3.3, 0.4, ins); at('Barrel', -2.45, 0.02, -2.3, 1.3, ins); at('Crate_Wooden', 2.4, 0.02, 0.6, 0.2, ins); at('Crate_Wooden', 2.35, 0.62, 0.65, 0.9, ins, 0.7); at('Chest_Wood__Base', -0.2, 0.02, 3.4, PI, ins); at('Chest_Wood__Lid', -0.2, 0.02, 3.4, PI, ins);
  at('Shelf_Small_Bottles', -1.3, 1.5, -3.75, 0, ins); at('Bag', 2.5, 0.02, -1.7, 0.5, ins); at('Bucket_Wooden_1', -2.4, 0.02, 0.3, 0, ins); at('Banner_1', 0.9, 2.5, -3.82, 0, ins);
  for (const [n, x, y, z, ry] of [['CandleStick_Triple', 0.6, 0.78, -0.6, 0.4], ['Mug', 0.25, 0.78, -0.2, 0], ['Mug', 1.0, 0.78, -1.1, 2], ['Table_Plate', 0.3, 0.78, -1.1, 0], ['Table_Plate', 0.95, 0.78, -0.1, 0], ['Bottle_1', 0.75, 0.78, -1.5, 0], ['Book_Stack_1', 0.55, 0.78, 0.3, 0.6], ['Candle_1', 0.6, 0.72, 3.5, 0], ['Lantern_Wall', -2.86, 1.9, -0.9, PI / 2]]) at(n, x, y, z, ry, { zone, skyVis: 0.3, lit: 1 });
  at('Chandelier', 0.3, 2.95, -0.5, 0, { zone, skyVis: 0.3, lit: 1 });
  for (const [n, x, y, z, ry] of [['Chandelier', 0.3, 2.95, -0.5, 0], ['CandleStick_Triple', 0.6, 0.78, -0.6, 0.4], ['Candle_1', 0.6, 0.72, 3.5, 0], ['Lantern_Wall', -2.86, 1.9, -0.9, PI / 2]]) {
    const M = Kit.matrix({ p: [ox + x, oy + y, oz + z], ry }); for (const p of Kit.lights(n)) { const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(M); lights.push({ p: [v.x, v.y, v.z], piece: n }); }
  }
  return { lights, zone };
}
