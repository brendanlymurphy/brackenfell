# Brackenfell

Play it: https://brendanlymurphy.github.io/brackenfell/ (phone or laptop browser).

A first-person medieval town on a misty lake: 58 interiors to enter, villagers with daily routines and voices, a main story in three
acts with two endings, an old mine, shops, secrets, day and night, weather. Runs on [Three.js](https://threejs.org) r187: WebGPU where
the browser has it, WebGL 2 otherwise (`?webgl` / `?webgpu` in the address forces one). The first engine is kept at [`classic/`](classic/).

## Working on it

Everything is in [`AGENTS.md`](AGENTS.md): build (`npm ci`, `node tools/build.mjs`), test (`node tools/gate.mjs --quick`), publish,
where each area's code lives, and the rules. `ROADMAP.md` lists what each build added and what is next; `docs/` has the design,
the engine by area, the story, and the decisions already taken.

## Credits

Everything third-party here is public domain (CC0).

- Surface textures: scans from ambientCG, cgbookcase and Nobiax, some edited by CryHam for Stunt Rally 3
  (`legacy/tools/texture-provenance.json`).
- Villagers: Quaternius Universal Base Characters and Modular Character Outfits - Fantasy; animation clips from the
  Mesh2Motion library (`chars/PROVENANCE.md`).
- Engine: Three.js (MIT licence).
