# Decisions: what was tried, rejected, and why

Read this before proposing something that sounds new. Each entry: what was tried, what happened, what stands now. Add an entry
whenever the owner rejects something or a measurement kills an idea; one paragraph is enough.

## Voices

- **Kokoro-82M (offline, Apache 2.0), Builds 20 to 35. Rejected by the owner as too artificial.** It scores about 1055 in the
  Artificial Analysis blind-listening arena against about 1200 for hosted leaders, and no amount of tuning (full-precision model, no
  pitch shift, blended voices, Build 27) changed the verdict. Now: Gemini 3.1 Flash TTS (`gemini-3.1-flash-tts-preview`), approved by
  ear from a 13-voice sample. Only the owner's ear decides voice quality; nobody on the team can listen.
- **Mixing two voice engines. Rejected.** For a few builds some characters had Gemini conversation and Kokoro barks. The old files were
  removed instead: a line without a recording is a subtitle, never the other engine.
- **`gemini-3.8-flash-tts` for the last lines when the 3.1 daily limit ran out. Rejected.** It has its own daily limit, but with our
  prompt it reads the acting direction aloud: Bram's "Hey! I only sell apples!" came back 24 seconds long, and was pushed before
  anyone measured it. Now: 3.1 only, and `tools/voice/check.mjs` fails any file over 0.45 s per character or over 30 s.
- **Processing speech (reverb, pitch shift, speed changes). Rejected.** The owner wants voices dry and exactly as the model made
  them. Speech bypasses every bus and reverb (`88d_voice.js`); generation only trims silence and sets the level.
- **Editing the text of a line that already has a recording. Never.** Files are keyed by speaker + exact on-screen text, so a changed
  comma silently turns a voiced line into a subtitle. New wording means a new line and a new recording.
- **Voicing remarks that anybody may say, the notice board and the slab in the Bread Cave. Not done.** A remark with speaker `*`
  would need 17 recordings each; the board and the slab are things you read. They stay subtitles.

## Characters

- **Mouths driven by loudness only (Build 49). Not good enough.** The jaw opens and closes with the 50 ms loudness of the playing
  line. It reads as a puppet: no lip shapes, and it flaps on consonants. The MakeHuman bodies have no jaw joint and no morph targets,
  so it was the most that could be done without new assets. Replaced by lip-sync tracks in the voice manifest (branch `fork-ch1`).
- **Chibi or cartoon character sets (Quaternius people, Builds 5 to 9). Rejected by the owner.** Now realistic MakeHuman bodies;
  the Quaternius set remains only as a fallback if `chars/real` fails to load.
- **Removing the last foot slide by tuning the playback rate. Exhausted.** The walk clip itself slides 0.25 m/s at the ball of the
  foot (`test/feet.js`); only foot-planting IK or better clips will fix it.

## Performance

- **`houseFar` 22 m (cheap house copies from 22 m on medium). Rejected.** It took the windows off the houses across the square,
  which the player stands and looks at. Now 45 m on medium and 26 m on low, and the saving comes from culling instead (view cone,
  the occlusion horizon, pooled batches: Build 49).
- **Hard budget of 220 draw calls / 380k triangles (medium) as a failing test. Dropped as a gate, kept as a target.** The town has
  been over it since the adventure and lighting work (square about 216 / 452k at Build 59), so a test that enforces it is always red
  and gets ignored. Now `tools/gate.mjs` fails only when a view gets worse than the last accepted measurement
  (`tools/gate_budget.json`) and prints "over target" otherwise.
- **KTX2 / Basis textures. Not done.** No encoder could be installed on the build machines and the asset hosts are blocked. The
  first-load saving came from meshopt geometry and half-size packs instead.
- **Half-size material pack on iPhones by default. Not done.** Safari does not report memory, and whether the ground is sharp
  enough at 512 has to be judged on a real phone. `?texpack=half` tries it.

## Look and world

- **An open, flat village with grass between rows (to Build 16). Rejected by the owner:** dense, layered, nothing bare. Hence the
  infill houses, levels, lanes and the Wharf.
- **One generic planned interior for every house. Rejected: "bare planned rooms".** Interiors must make physical sense and be
  richly filled; each building has a designed plan or one of six layout families.
- **Seamless interiors inside the village shell. Replaced at Build 19** by separate cells behind a fade: it removed the flicker
  from coplanar walls and let interiors be bigger than their shells.
- **Buildings and windows that glow at night, bloom-white panes. Rejected (Builds 26, 31).** Panes are tuned for the night exposure;
  glows have an angular size limit.
- **Text box for dialogue, discovery jingle, echo outdoors. Rejected (Build 26).** Plain white subtitles; no jingle; open air is dry.
- **Generated trees. Rejected as the least realistic thing outdoors.** Scanned Poly Haven trees with stand-ins since Build 31.

## Process

- **Committing the built files (`game.js`, `index.html`, `sw.js`, `three.js`) with every commit. Being retired.** GitHub Pages
  served the `main` branch as it is, so the bundle had to be in the repository. Cost: every merge between two branches conflicts in
  all four files, the bundle is 9 MB of history, and a forgotten rebuild ships stale code. Plan (see `ROADMAP.md`, infrastructure):
  Pages deploys from a GitHub Actions build of `main`. Until the owner switches the Pages source, the files stay committed and
  the rule is: never merge them by hand, rebuild.
- **Tracking tool intermediates (`tools/scan/_bake`, 200 MB). Rejected.** It was a third of every checkout and was deployed to the
  live site. Untracked at Build 60; `kits/TREES_PROVENANCE.md` says how to get it back.
- **The coordinator running every worker's tests again before merging ("double gating"). Being retired.** One command
  (`node tools/gate.mjs`) and the same command on GitHub's machines for every push, so a branch arrives with its result attached.
- **Two browsers at once on a small machine, and more than three workers on two cores. Rejected:** software-rendered tabs starve
  each other and time out, which looks like test failures.
- **`git stash` in a worker. Never.** The stash is shared by every worktree of a repository; one worker popped another's changes.
- **Vague worker briefs. Rejected.** Briefs that named concrete defects and a measurable check worked; vague ones produced work that
  passed tests and looked wrong.
- **Announcing a build as live without checking the deployment.** Builds 10 and 11 were announced while their Pages deployments had
  failed (a tracked symlink). Check the run and the live `game.js?v=` hash.
