// dev only: drop wardrobe parts a body never wears (size), then chars_lod + assets_pack as usual
import { NodeIO } from '@gltf-transform/core'; import fs from 'node:fs';
const io = new NodeIO(), RM = { straw: new Set(['m_boy','m_elder','m_guard','m_hunter','m_innkeeper','m_monk','m_smith','m_youth','f_child','f_elder','f_girl','f_herbalist','f_maid','f_weaver','o_brute','o_hood_f','o_hood_m','o_rogue']) };
const MALE = /^m_|^o_brute|^o_rogue|^o_hood_m/;
for (const f of process.argv.slice(2)) { const b = f.replace(/.*\//, '').replace('.glb', ''), doc = await io.read(f); let n = 0;
  for (const node of doc.getRoot().listNodes()) { const nm = node.getName(); if (!node.getMesh()) continue;
    const drop = (/^w_hat_straw/.test(nm) && RM.straw.has(b)) || (/^w_hat_coif/.test(nm) && MALE.test(b)) || (/^w_cloak/.test(nm) && /child|boy|girl|monk|elder|hood/.test(b)) || (/^w_(apron|straps)/.test(nm) && /child|boy|monk|hood/.test(b));
    if (drop) { const m = node.getMesh(); node.dispose(); for (const p of m.listPrimitives()) p.dispose(); m.dispose(); n++; } }
  await io.write(f, doc); console.log(b, 'dropped', n); }
