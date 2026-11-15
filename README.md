# Brackenfell

A small highland village you can walk around in the browser, on a phone or a laptop: houses you can enter, villagers
with daily routines, a short chain of errands, day and night, weather.

Play it: https://brendanlymurphy.github.io/brackenfell/

## Build 10 (realistic MakeHuman villagers and outlaws, CC0; performance and texture-memory pass; photo-scanned Poly Haven props; sprint, jump, sword combat, outlaw camps, loot, inventory, three new quests; on top of Build 6: kit-built houses with scanned-texture skin; Quaternius Medieval Village and Fantasy Props kits, CC0)

- Runs on [Three.js](https://threejs.org) r187: WebGPU where the browser has it, WebGL 2 otherwise. If WebGPU reports errors
  or loses its device while starting, the page remembers that and reloads itself on WebGL 2. Menu → Settings → Graphics engine
  switches by hand, and `?webgl` / `?webgpu` in the address overrides both.
- Animated villagers (Quaternius bodies and outfits, Mesh2Motion animation clips) replace the hand-built ones.
- Overcast sky with dawn mist, meadow grass, water, fire and smoke as separate modules.
- The previous build is kept at [`classic/`](classic/).

## Layout

- `src/` game source. Plain scripts, concatenated in file-name order; `src/lib/three-entry.js` lists what is used from Three.js.
- `tools/build.mjs` builds `three.js`, `game.js` and `index.html` into the repo root (`npm install`, then `npm run build`).
- `tex/` texture pack (25 surface layers as ASTC and as WebP/JPEG), `chars/` villager models and clips.
- `test/` headless-browser checks: `node test/shot.mjs --opt webgl=1 --do "$(cat test/quest.js)"` plays the whole errand chain;
  `test/real.mjs` is a production-mode boot; `test/fallback.mjs` checks the WebGPU → WebGL 2 fallback.
- `classic/`, `legacy/` Build 4 (hand-written WebGPU renderer), its source, texture bake tools and tests.
- `ROADMAP.md` what comes next; `tools/release.md` how a build is published.

## Credits

Everything third-party here is public domain (CC0).

- Surface textures: scans from ambientCG, cgbookcase and Nobiax, some edited by CryHam for Stunt Rally 3
  (`legacy/tools/texture-provenance.json`).
- Villagers: Quaternius Universal Base Characters and Modular Character Outfits - Fantasy; animation clips from the
  Mesh2Motion library (`chars/PROVENANCE.md`).
- Engine: Three.js (MIT licence).
