# Bugs found by playing

Found by `test/playbot.mjs` (a bot that plays by real key presses, clicks and taps; travel is by teleport) and by reading what it
tripped over. Severity: **S1** blocks the story, loses a save or crashes; **S2** breaks a feature or leaves the player stuck until a
reload; **S3** is wrong but can be played round. Each fixed bug names the check that keeps it fixed (a scenario of the bot or a step
of `tools/gate.mjs`). Visual overlap and layout belong to `docs/DEFECTS.md`.

What the bot cannot see: frame rate on a real phone, flicker, anything audible, whether a walk between two places is pleasant.

## Fixed

| # | Sev | What happened | How to reproduce (before the fix) | Fix | Check |
|---|---|---|---|---|---|
| 1 | S1 | The crypt gate was shut again after a reload, with no prompt to open it: the reliquary behind it (mine key, lantern, ledger) could never be reached, so the main story stopped at "Open the reliquary". | Take the crypt key, unlock the gate, reload the page before opening the reliquary, Continue. | `applySave` (80_game.js) opens every gate the save says is unlocked: the world is built before the save is read. | bot `reload` (world agrees with the save at every checkpoint) |
| 2 | S2 | Loading a save put the player inside a building a kilometre from where they saved (seen at Hale's post by the gate: loaded 981 m away). The migration for saves older than Build 19 ran on every save made outdoors inside a building's old footprint. | Stand by Hale at the gate, reload, Continue. | Saves carry the build that wrote them (`b`); only a save with no stamp and no list of discovered places is migrated. | bot `reload` (position after loading within 3 m) |
| 3 | S3 | Progress made between two save points was lost on a crash or when a phone dropped the tab: experience and levels from finishing a quest, the bell flag, coin spent on stew, ale and apples, what you had heard about the shut house. | Finish a quest (level up), kill the tab, reopen: the level is gone. | The game now saves every 10 s of play and whenever the page is hidden (85_ui.js), as well as at the old save points. | bot: after every step, what is saved equals what is held |

## Open

(none yet)
