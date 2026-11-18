# Brackenfell

**Read `docs/HANDBOOK.md` before anything else**, then `docs/NEXT.md` (the exact state of every branch when work was stopped on
18 November 2026). The handbook holds what the project is, what the owner wants, why it kept breaking, the rules, how to build,
test, look and publish, how assets get in, and the plan. `AGENTS.md` has the build, gate and voice commands in full.

Short version of the rules: nothing recognisable is built from code primitives (a model or nothing); nothing is done until
the room camera and the walk camera have been over it and every frame has been looked at; proof of a fix is the owner's own
view, before and after; one area per session, commit and push after every step; say what you did not check.

Build: `npm ci && node tools/build.mjs`. Test: `node tools/gate.mjs --quick`. Development branch `threejs`; `main` is live.
