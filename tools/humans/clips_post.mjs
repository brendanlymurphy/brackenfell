// Shrinks the retargeted clips file: drops keyframes a linear blend reproduces, then writes the GLB.
// usage: node clips_post.mjs <in.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import { resample, prune } from '@gltf-transform/functions';
const [src, dst] = process.argv.slice(2);
const io = new NodeIO(), doc = await io.read(src);
await doc.transform(resample({ tolerance: 0.0008 }), prune());
await io.write(dst, doc);
const n = doc.getRoot().listAnimations().length; console.log(JSON.stringify({ out: dst, clips: n }));
