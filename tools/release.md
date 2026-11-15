# Publishing a build

GitHub Pages serves the `main` branch from the repo root. Development happens on `threejs`, where the three built files
are git-ignored so that merges stay clean.

1. On `threejs`: `npm install` (once), `npm run build`, then run the checks:
   - `node test/shot.mjs --opt webgl=1 --opt quality=medium --do "$(cat test/quest.js)"` must end with `fire 99 bonfire true`
   - the same without `--opt webgl=1` (WebGPU, drawn off screen in test mode)
   - `node test/real.mjs` (production boot on WebGL 2) and `node test/fallback.mjs` (must end on `"backend":"WebGL 2"`)
2. `git checkout main && git merge threejs`
3. `npm run build`, then force-add the built files, which `.gitignore` leaves out:
   `git add -f index.html game.js three.js`
4. Commit and push `main`. Pages updates a minute or two later. The script tags carry a content hash (`?v=`), so browsers
   pick up new code without a hard reload.
5. `git checkout threejs` again for further work (the built files in the working tree are ignored there).

What a visitor downloads the first time (Build 5): about 35 MB on a device with ASTC textures (every iPhone and most
Android phones, Apple-silicon Macs), about 29 MB elsewhere.

| Part | Size |
|---|---|
| `three.js` + `game.js` + `index.html` | 1.8 MB (about 0.5 MB compressed in transit) |
| texture pack, ASTC (`tex/*.png`) | 29.0 MB |
| texture pack, images (`tex/*.webp`, `tex/*.jpg`), used only without ASTC | 23.3 MB |
| `tex/noise.bin` | 0.3 MB |
| villagers (`chars/`) | 4.0 MB |

`classic/index.html` is Build 4. It reads the same `tex/` folder (through `../tex/`) and ignores the files added since.
