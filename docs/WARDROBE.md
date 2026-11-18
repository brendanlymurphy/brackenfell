# Wardrobe: what a villager can be dressed in

What the character pipeline can vary today, for whoever dresses the cast (`docs/PEOPLE.md`). Owner: Agent Four (`src/49_chars.js`,
`tools/humans/`). Test: `test/dress.js` (households and workplaces), `test/garb.js` (every piece on every body, six poses).

## Bodies (`chars/real/*.glb`, built by `tools/humans/`)

Each body is one person's build, face, hair style and boots; everything else is laid over it. 17 for the town, 4 for outlaws.

| Body | Sex, age | Hair style | Under the wardrobe | Wardrobe it carries |
|---|---|---|---|---|
| `m_farmer` | man, ~35 | short, messy | knee-length kirtle, wool hose, boots | cap, hood, straw hat; belt, pouch; three aprons, straps; back cloak |
| `m_hunter` | man, ~45 | short | knee kirtle, wool hose | same |
| `m_fisher` | man, ~55 | short | knee kirtle, wool hose | same |
| `m_innkeeper` | man, ~50 | short | knee kirtle, hose | same |
| `m_youth` | man, ~20 | short | knee kirtle, hose | same |
| `m_smith` | man, ~45 | short | short-sleeved knee kirtle, hose | same |
| `m_boy` | boy, ~10 | short | knee kirtle, hose | same |
| `m_guard` | man, ~40 | short | stock tunic, hose | kettle hat, cap, coif, straw; tabard, cuffs, belt, pouch, apron, straps, cloak |
| `m_elder`, `m_monk` | old man | short / tonsure | monk's robe | none (robe only) |
| `f_maid`, `f_weaver`, `f_herbalist`, `f_farmer`, `f_girl` | women ~20 to ~45 | double braid / bun / French braid / braid / ponytail | ankle-length kirtle | kerchief, coif (f_farmer also straw); belt, pouch; three aprons, straps; back cloak |
| `f_elder` | old woman | bun | robe | none |
| `f_child` | girl, ~8 | plaits | ankle kirtle (smock) | coif, kerchief, belt |

Build and girth vary per person on top of the body (±4% height, ±8% girth, by id). Faces are the body's.

## What can be chosen per person (no new model needed)

- **Hat**: one of what the body carries, or none. Off at table indoors; hat and outer garments off in bed.
- **Hair colour**: a multiplier on the hair texture (`tint.hair`); grey by age (52+ greying, 62+ grey).
- **Colours** of every garment slot: main garment (wool), hat, apron, cloak, tabard, linen, leather, straps.
- **Pieces**: belt, pouch, apron (full, half, long), straps, back cloak, tabard (guard body).
- **Held things** by trade (`src/77d_handprops.js`): besom, shears, awl, knife, cleaver, mallet, axe, paddle, dough scraper,
  pestle, tinker's hammer, netting shuttle, sickle, tongs; lute, smith's hammer, spear, staff, rod, mug.

## What needs a new body (Blender; not on this machine)

A different hair style, beard, face, build beyond ±8%, sleeve or hem length, a gown or surcoat, women's hose, a man's long robe
other than the monk's. Bodies are 450 to 600 KB each and every person on screen costs a draw call per body, so new bodies should
be few and chosen from the cast's real needs.

## The rule in the game

`dressPlan()` (`src/49_chars.js`) dresses the cast in id order: each person takes the first hat, hair colour and garment colour
(starting from their own hash) that nobody already dressed in their household or workplace has. A story person's own hat, hair or
colour (`NPC_DEFS`) is kept and counts as taken.
