# Review: Build 89 (live), the slice by the reviewer's own camera

Inbox 16:45 UTC 18 Nov: until the first candidate, walk the slice on live Build 89 every 5 m and file what is seen, starting at the chapel and the north gate.
`test/audit/slicewalk.js` puts the camera at eye height (ground + 1.6 m) every 5 m along the villagers' paths, looking along the path ahead and
behind, at 13:00 and at 22:00. Medium quality, WebGL, 960 x 540. Segments: the square to the north gate and up to the chapel (`ngate`), the
chapel door back to the wall (`chapel`), from outside the north wall in (`nout`), the west gate road to the square (`west`), the alley to Quill's
(`alley`), the Hart's front (`hart`), a ring 11 m round the fire pit (`ring`). Every frame was looked at on 3 x 3 sheets (`test/audit/slicesheets.py`), and suspect ones
at full size. Pictures: `build89_faults.jpg` here; the frames themselves are not committed (280 x 100 kB) and can be remade with the two scripts.

**Verdict: by the coordinator's rule, Build 89 would not ship.** A walking player would call these broken: the post and beam across the chapel door, the
bank wedge on the chapel way (what the owner saw), the ivy in the air at the gate, the cube flowers at the Hart, and the "Discovered · undefined"
banner (`docs/audit/QUESTWALK.md`, fault 1).

| | Frames |
|---|---|
| Looked at | 280 |
| Pass | 199 |
| Fault named | 73 |
| Not a player view (the ring crossed the Hart: camera inside its walls) | 8 |

Not seen by this camera: the hanging timber and the stretched spike the owner saw at the chapel. The chapel frames show a beam across the door and a
spike fringe at the Hart, not certainly the same things; the chapel's roof and tower were not in any frame at eye height from the paths (look up next).
Headless: nothing in motion (popping, flicker, z-fighting), nothing heard.

## Faults, one per thing (frames in the table below)

- **through a doorway**: a dark post stands in the middle of the chapel door and a beam crosses it at knee height, 1 m out (-6, -65.2): the door cannot be walked to straight (`chapel_006_f_d`, `chapel_006_f_n`, `chapel_007_f_d`, `chapel_007_f_n`)
- **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside (`ngate_017_b_d`, `ngate_017_b_n`, `ngate_018_b_d`, `ngate_018_b_n` ...)
- **ruler edge**: outside the north gate the path is cut into the bank with a dead-straight sharp edge (`ngate_013_f_d`, `ngate_013_f_n`)
- **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it (`ngate_018_f_d`, `ngate_018_f_n`, `chapel_000_b_d`, `chapel_000_b_n` ...)
- **floating**: ivy sprigs hang in the air in front of the gate passage, attached to nothing (`chapel_006_b_d`, `chapel_006_b_n`)
- **flat colour**: an untextured dark slab about 1.5 m wide and 3 m tall stands beside the way to the chapel door (`chapel_007_b_d`, `chapel_007_b_n`)
- **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall (`ngate_001_f_d`, `ngate_002_f_d`, `ngate_003_b_d`, `ngate_001_f_n` ...)
- **flat colour**: a woodpile whose log ends are flat white discs (`ngate_004_f_d`, `ngate_005_b_d`, `ngate_004_f_n`)
- **flat colour**: free-standing posts in the street are plain black boxes with no texture (`ngate_002_f_d`, `west_004_f_d`, `west_005_f_d`, `west_006_b_d` ...)
- **flat colour**: a black board on the house wall beside the door (`chapel_001_b_d`, `nout_002_f_d`, `chapel_001_b_n`, `nout_002_f_n`)
- **stretched**: grass texture smeared down the steep bank (`chapel_001_f_d`, `nout_002_b_d`)
- **primitive shape**: the Hart's window-box flowers are pastel cubes; **spike**: a fringe of grey spikes hangs from the sill above the window (`hart_001_f_d`, `hart_001_f_n`)
- **stretched**: the stall's table top shows the wood grain pulled into straight stripes (`ring_008_b_d`)
- **flat colour**: the chapel's windows glow saturated green and pink at night (`ngate_016_b_n`, `chapel_001_f_n`, `chapel_002_f_n`, `nout_002_b_n` ...)
- **flat colour**: puddles on the west road read as white paint at night (`west_000_f_n`, `west_001_f_n`, `west_002_b_n`, `west_003_b_n` ...)
- borderline: the gate stair is a black box at night, no texture reads (`ngate_010_f_n`)
- borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square (`alley_002_f_d`, `alley_003_f_d`, `alley_004_b_d`, `alley_004_f_d` ...)

| Frame | x, z | Looking, hour | Verdict |
|---|---|---|---|
| `ngate_000_b_d` | -3.1, -11.7 (ground 0.0) | behind, 13:00 | pass |
| `ngate_000_b_n` | -3.1, -11.7 (ground 0.0) | behind, 22:00 | pass |
| `ngate_000_f_d` | -3.1, -11.7 (ground 0.0) | ahead, 13:00 | pass |
| `ngate_000_f_n` | -3.1, -11.7 (ground 0.0) | ahead, 22:00 | pass |
| `ngate_001_b_d` | -7.4, -9.4 (ground 0.0) | behind, 13:00 | pass |
| `ngate_001_b_n` | -7.4, -9.4 (ground 0.0) | behind, 22:00 | pass |
| `ngate_001_f_d` | -7.4, -9.4 (ground 0.0) | ahead, 13:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall |
| `ngate_001_f_n` | -7.4, -9.4 (ground 0.0) | ahead, 22:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall |
| `ngate_002_b_d` | -10.6, -10 (ground 0.0) | behind, 13:00 | pass |
| `ngate_002_b_n` | -10.6, -10 (ground 0.0) | behind, 22:00 | pass |
| `ngate_002_f_d` | -10.6, -10 (ground 0.0) | ahead, 13:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall; **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `ngate_002_f_n` | -10.6, -10 (ground 0.0) | ahead, 22:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall |
| `ngate_003_b_d` | -11.9, -14.8 (ground 0.0) | behind, 13:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall |
| `ngate_003_b_n` | -11.9, -14.8 (ground 0.0) | behind, 22:00 | **primitive shape**: a faceted grey lump (a low-poly sack) at the foot of the market stall |
| `ngate_003_f_d` | -11.9, -14.8 (ground 0.0) | ahead, 13:00 | pass |
| `ngate_003_f_n` | -11.9, -14.8 (ground 0.0) | ahead, 22:00 | pass |
| `ngate_004_b_d` | -13, -19.7 (ground 0.1) | behind, 13:00 | pass |
| `ngate_004_b_n` | -13, -19.7 (ground 0.1) | behind, 22:00 | pass |
| `ngate_004_f_d` | -13, -19.7 (ground 0.1) | ahead, 13:00 | **flat colour**: a woodpile whose log ends are flat white discs |
| `ngate_004_f_n` | -13, -19.7 (ground 0.1) | ahead, 22:00 | **flat colour**: a woodpile whose log ends are flat white discs |
| `ngate_005_b_d` | -13.8, -24.6 (ground 0.6) | behind, 13:00 | **flat colour**: a woodpile whose log ends are flat white discs |
| `ngate_005_b_n` | -13.8, -24.6 (ground 0.6) | behind, 22:00 | pass |
| `ngate_005_f_d` | -13.8, -24.6 (ground 0.6) | ahead, 13:00 | pass |
| `ngate_005_f_n` | -13.8, -24.6 (ground 0.6) | ahead, 22:00 | pass |
| `ngate_006_b_d` | -14.4, -29.6 (ground 1.0) | behind, 13:00 | pass |
| `ngate_006_b_n` | -14.4, -29.6 (ground 1.0) | behind, 22:00 | pass |
| `ngate_006_f_d` | -14.4, -29.6 (ground 1.0) | ahead, 13:00 | pass |
| `ngate_006_f_n` | -14.4, -29.6 (ground 1.0) | ahead, 22:00 | pass |
| `ngate_007_b_d` | -14.6, -34.6 (ground 1.5) | behind, 13:00 | pass |
| `ngate_007_b_n` | -14.6, -34.6 (ground 1.5) | behind, 22:00 | pass |
| `ngate_007_f_d` | -14.6, -34.6 (ground 1.5) | ahead, 13:00 | pass |
| `ngate_007_f_n` | -14.6, -34.6 (ground 1.5) | ahead, 22:00 | pass |
| `ngate_008_b_d` | -14.2, -39.6 (ground 2.1) | behind, 13:00 | pass |
| `ngate_008_b_n` | -14.2, -39.6 (ground 2.1) | behind, 22:00 | pass |
| `ngate_008_f_d` | -14.2, -39.6 (ground 2.1) | ahead, 13:00 | pass |
| `ngate_008_f_n` | -14.2, -39.6 (ground 2.1) | ahead, 22:00 | pass |
| `ngate_009_b_d` | -13.3, -44.5 (ground 3.2) | behind, 13:00 | pass |
| `ngate_009_b_n` | -13.3, -44.5 (ground 3.2) | behind, 22:00 | pass |
| `ngate_009_f_d` | -13.3, -44.5 (ground 3.2) | ahead, 13:00 | pass |
| `ngate_009_f_n` | -13.3, -44.5 (ground 3.2) | ahead, 22:00 | pass |
| `ngate_010_b_d` | -11.9, -49.3 (ground 3.4) | behind, 13:00 | pass |
| `ngate_010_b_n` | -11.9, -49.3 (ground 3.4) | behind, 22:00 | pass |
| `ngate_010_f_d` | -11.9, -49.3 (ground 3.4) | ahead, 13:00 | pass |
| `ngate_010_f_n` | -11.9, -49.3 (ground 3.4) | ahead, 22:00 | borderline: the gate stair is a black box at night, no texture reads |
| `ngate_011_b_d` | -10, -53.9 (ground 4.3) | behind, 13:00 | pass |
| `ngate_011_b_n` | -10, -53.9 (ground 4.3) | behind, 22:00 | pass |
| `ngate_011_f_d` | -10, -53.9 (ground 4.3) | ahead, 13:00 | pass |
| `ngate_011_f_n` | -10, -53.9 (ground 4.3) | ahead, 22:00 | pass |
| `ngate_012_b_d` | -7.5, -58.2 (ground 5.3) | behind, 13:00 | pass |
| `ngate_012_b_n` | -7.5, -58.2 (ground 5.3) | behind, 22:00 | pass |
| `ngate_012_f_d` | -7.5, -58.2 (ground 5.3) | ahead, 13:00 | pass |
| `ngate_012_f_n` | -7.5, -58.2 (ground 5.3) | ahead, 22:00 | pass |
| `ngate_013_b_d` | -3.7, -60.8 (ground 6.1) | behind, 13:00 | pass |
| `ngate_013_b_n` | -3.7, -60.8 (ground 6.1) | behind, 22:00 | pass |
| `ngate_013_f_d` | -3.7, -60.8 (ground 6.1) | ahead, 13:00 | **ruler edge**: outside the north gate the path is cut into the bank with a dead-straight sharp edge |
| `ngate_013_f_n` | -3.7, -60.8 (ground 6.1) | ahead, 22:00 | **ruler edge**: outside the north gate the path is cut into the bank with a dead-straight sharp edge |
| `ngate_014_b_d` | 0.9, -62.8 (ground 6.4) | behind, 13:00 | pass |
| `ngate_014_b_n` | 0.9, -62.8 (ground 6.4) | behind, 22:00 | pass |
| `ngate_014_f_d` | 0.9, -62.8 (ground 6.4) | ahead, 13:00 | pass |
| `ngate_014_f_n` | 0.9, -62.8 (ground 6.4) | ahead, 22:00 | pass |
| `ngate_015_b_d` | 4.6, -66 (ground 6.4) | behind, 13:00 | pass |
| `ngate_015_b_n` | 4.6, -66 (ground 6.4) | behind, 22:00 | pass |
| `ngate_015_f_d` | 4.6, -66 (ground 6.4) | ahead, 13:00 | pass |
| `ngate_015_f_n` | 4.6, -66 (ground 6.4) | ahead, 22:00 | pass |
| `ngate_016_b_d` | 6.9, -65.5 (ground 5.6) | behind, 13:00 | pass |
| `ngate_016_b_n` | 6.9, -65.5 (ground 5.6) | behind, 22:00 | **flat colour**: the chapel's windows glow saturated green and pink at night |
| `ngate_016_f_d` | 6.9, -65.5 (ground 5.6) | ahead, 13:00 | pass |
| `ngate_016_f_n` | 6.9, -65.5 (ground 5.6) | ahead, 22:00 | pass |
| `ngate_017_b_d` | 8.3, -60.7 (ground 3.9) | behind, 13:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside |
| `ngate_017_b_n` | 8.3, -60.7 (ground 3.9) | behind, 22:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside |
| `ngate_017_f_d` | 8.3, -60.7 (ground 3.9) | ahead, 13:00 | pass |
| `ngate_017_f_n` | 8.3, -60.7 (ground 3.9) | ahead, 22:00 | pass |
| `ngate_018_b_d` | 8.3, -58.9 (ground 4.1) | behind, 13:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside |
| `ngate_018_b_n` | 8.3, -58.9 (ground 4.1) | behind, 22:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside; **flat colour**: the chapel's windows glow saturated green and pink at night |
| `ngate_018_f_d` | 8.3, -58.9 (ground 4.1) | ahead, 13:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `ngate_018_f_n` | 8.3, -58.9 (ground 4.1) | ahead, 22:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `chapel_000_b_d` | 8.3, -58.9 (ground 4.1) | behind, 13:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `chapel_000_b_n` | 8.3, -58.9 (ground 4.1) | behind, 22:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `chapel_000_f_d` | 8.3, -58.9 (ground 4.1) | ahead, 13:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside |
| `chapel_000_f_n` | 8.3, -58.9 (ground 4.1) | ahead, 22:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside; **flat colour**: the chapel's windows glow saturated green and pink at night |
| `chapel_001_b_d` | 7.4, -63.7 (ground 4.7) | behind, 13:00 | **flat colour**: a black board on the house wall beside the door |
| `chapel_001_b_n` | 7.4, -63.7 (ground 4.7) | behind, 22:00 | **flat colour**: a black board on the house wall beside the door |
| `chapel_001_f_d` | 7.4, -63.7 (ground 4.7) | ahead, 13:00 | **stretched**: grass texture smeared down the steep bank |
| `chapel_001_f_n` | 7.4, -63.7 (ground 4.7) | ahead, 22:00 | **flat colour**: the chapel's windows glow saturated green and pink at night |
| `chapel_002_b_d` | 5.8, -67.4 (ground 6.4) | behind, 13:00 | pass |
| `chapel_002_b_n` | 5.8, -67.4 (ground 6.4) | behind, 22:00 | pass |
| `chapel_002_f_d` | 5.8, -67.4 (ground 6.4) | ahead, 13:00 | pass |
| `chapel_002_f_n` | 5.8, -67.4 (ground 6.4) | ahead, 22:00 | **flat colour**: the chapel's windows glow saturated green and pink at night |
| `chapel_003_b_d` | 2.5, -63.7 (ground 6.4) | behind, 13:00 | pass |
| `chapel_003_b_n` | 2.5, -63.7 (ground 6.4) | behind, 22:00 | pass |
| `chapel_003_f_d` | 2.5, -63.7 (ground 6.4) | ahead, 13:00 | pass |
| `chapel_003_f_n` | 2.5, -63.7 (ground 6.4) | ahead, 22:00 | pass |
| `chapel_004_b_d` | -1.9, -61.3 (ground 6.4) | behind, 13:00 | pass |
| `chapel_004_b_n` | -1.9, -61.3 (ground 6.4) | behind, 22:00 | pass |
| `chapel_004_f_d` | -1.9, -61.3 (ground 6.4) | ahead, 13:00 | pass |
| `chapel_004_f_n` | -1.9, -61.3 (ground 6.4) | ahead, 22:00 | pass |
| `chapel_005_b_d` | -6.5, -60.2 (ground 5.9) | behind, 13:00 | pass |
| `chapel_005_b_n` | -6.5, -60.2 (ground 5.9) | behind, 22:00 | pass |
| `chapel_005_f_d` | -6.5, -60.2 (ground 5.9) | ahead, 13:00 | pass |
| `chapel_005_f_n` | -6.5, -60.2 (ground 5.9) | ahead, 22:00 | pass |
| `chapel_006_b_d` | -6, -65.2 (ground 6.4) | behind, 13:00 | **floating**: ivy sprigs hang in the air in front of the gate passage, attached to nothing |
| `chapel_006_b_n` | -6, -65.2 (ground 6.4) | behind, 22:00 | **floating**: ivy sprigs hang in the air in front of the gate passage, attached to nothing |
| `chapel_006_f_d` | -6, -65.2 (ground 6.4) | ahead, 13:00 | **through a doorway**: a dark post stands in the middle of the chapel door and a beam crosses it at knee height, 1 m out (-6, -65.2): the door cannot be walked to straight |
| `chapel_006_f_n` | -6, -65.2 (ground 6.4) | ahead, 22:00 | **through a doorway**: a dark post stands in the middle of the chapel door and a beam crosses it at knee height, 1 m out (-6, -65.2): the door cannot be walked to straight |
| `chapel_007_b_d` | -6, -66.4 (ground 6.4) | behind, 13:00 | **flat colour**: an untextured dark slab about 1.5 m wide and 3 m tall stands beside the way to the chapel door |
| `chapel_007_b_n` | -6, -66.4 (ground 6.4) | behind, 22:00 | **flat colour**: an untextured dark slab about 1.5 m wide and 3 m tall stands beside the way to the chapel door |
| `chapel_007_f_d` | -6, -66.4 (ground 6.4) | ahead, 13:00 | **through a doorway**: a dark post stands in the middle of the chapel door and a beam crosses it at knee height, 1 m out (-6, -65.2): the door cannot be walked to straight |
| `chapel_007_f_n` | -6, -66.4 (ground 6.4) | ahead, 22:00 | **through a doorway**: a dark post stands in the middle of the chapel door and a beam crosses it at knee height, 1 m out (-6, -65.2): the door cannot be walked to straight |
| `nout_000_b_d` | 8.9, -72.3 (ground 5.3) | behind, 13:00 | pass |
| `nout_000_b_n` | 8.9, -72.3 (ground 5.3) | behind, 22:00 | pass |
| `nout_000_f_d` | 8.9, -72.3 (ground 5.3) | ahead, 13:00 | pass |
| `nout_000_f_n` | 8.9, -72.3 (ground 5.3) | ahead, 22:00 | pass |
| `nout_001_b_d` | 6.3, -68 (ground 6.2) | behind, 13:00 | pass |
| `nout_001_b_n` | 6.3, -68 (ground 6.2) | behind, 22:00 | pass |
| `nout_001_f_d` | 6.3, -68 (ground 6.2) | ahead, 13:00 | pass |
| `nout_001_f_n` | 6.3, -68 (ground 6.2) | ahead, 22:00 | pass |
| `nout_002_b_d` | 7.6, -63.2 (ground 4.5) | behind, 13:00 | **stretched**: grass texture smeared down the steep bank |
| `nout_002_b_n` | 7.6, -63.2 (ground 4.5) | behind, 22:00 | **flat colour**: the chapel's windows glow saturated green and pink at night |
| `nout_002_f_d` | 7.6, -63.2 (ground 4.5) | ahead, 13:00 | **flat colour**: a black board on the house wall beside the door |
| `nout_002_f_n` | 7.6, -63.2 (ground 4.5) | ahead, 22:00 | **flat colour**: a black board on the house wall beside the door |
| `nout_003_b_d` | 8.3, -58.9 (ground 4.1) | behind, 13:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside |
| `nout_003_b_n` | 8.3, -58.9 (ground 4.1) | behind, 22:00 | **ruler edge**: the earth bank beside the chapel way is a wedge with a ruler-straight ridge; a thin sheet of grass lies on its flank with a sharp edge, water strip beside; **flat colour**: the chapel's windows glow saturated green and pink at night |
| `nout_003_f_d` | 8.3, -58.9 (ground 4.1) | ahead, 13:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `nout_003_f_n` | 8.3, -58.9 (ground 4.1) | ahead, 22:00 | **inside a tree**: a node of the villagers' path at (8.3, -58.9) stands inside a tree trunk; the camera sees bark; villagers walk through it |
| `west_000_b_d` | -71.6, -5.6 (ground 0.5) | behind, 13:00 | pass |
| `west_000_b_n` | -71.6, -5.6 (ground 0.5) | behind, 22:00 | pass |
| `west_000_f_d` | -71.6, -5.6 (ground 0.5) | ahead, 13:00 | pass |
| `west_000_f_n` | -71.6, -5.6 (ground 0.5) | ahead, 22:00 | **flat colour**: puddles on the west road read as white paint at night |
| `west_001_b_d` | -66.7, -5.3 (ground 0.4) | behind, 13:00 | pass |
| `west_001_b_n` | -66.7, -5.3 (ground 0.4) | behind, 22:00 | pass |
| `west_001_f_d` | -66.7, -5.3 (ground 0.4) | ahead, 13:00 | pass |
| `west_001_f_n` | -66.7, -5.3 (ground 0.4) | ahead, 22:00 | **flat colour**: puddles on the west road read as white paint at night |
| `west_002_b_d` | -61.7, -5 (ground 0.2) | behind, 13:00 | pass |
| `west_002_b_n` | -61.7, -5 (ground 0.2) | behind, 22:00 | **flat colour**: puddles on the west road read as white paint at night |
| `west_002_f_d` | -61.7, -5 (ground 0.2) | ahead, 13:00 | pass |
| `west_002_f_n` | -61.7, -5 (ground 0.2) | ahead, 22:00 | pass |
| `west_003_b_d` | -56.7, -4.7 (ground 0.0) | behind, 13:00 | pass |
| `west_003_b_n` | -56.7, -4.7 (ground 0.0) | behind, 22:00 | **flat colour**: puddles on the west road read as white paint at night |
| `west_003_f_d` | -56.7, -4.7 (ground 0.0) | ahead, 13:00 | pass |
| `west_003_f_n` | -56.7, -4.7 (ground 0.0) | ahead, 22:00 | pass |
| `west_004_b_d` | -51.7, -4.5 (ground -0.1) | behind, 13:00 | pass |
| `west_004_b_n` | -51.7, -4.5 (ground -0.1) | behind, 22:00 | **flat colour**: puddles on the west road read as white paint at night |
| `west_004_f_d` | -51.7, -4.5 (ground -0.1) | ahead, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_004_f_n` | -51.7, -4.5 (ground -0.1) | ahead, 22:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_005_b_d` | -46.7, -4.3 (ground -0.1) | behind, 13:00 | pass |
| `west_005_b_n` | -46.7, -4.3 (ground -0.1) | behind, 22:00 | pass |
| `west_005_f_d` | -46.7, -4.3 (ground -0.1) | ahead, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_005_f_n` | -46.7, -4.3 (ground -0.1) | ahead, 22:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_006_b_d` | -41.7, -4 (ground -0.2) | behind, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_006_b_n` | -41.7, -4 (ground -0.2) | behind, 22:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_006_f_d` | -41.7, -4 (ground -0.2) | ahead, 13:00 | pass |
| `west_006_f_n` | -41.7, -4 (ground -0.2) | ahead, 22:00 | pass |
| `west_007_b_d` | -36.7, -3.7 (ground -0.2) | behind, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_007_b_n` | -36.7, -3.7 (ground -0.2) | behind, 22:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_007_f_d` | -36.7, -3.7 (ground -0.2) | ahead, 13:00 | pass |
| `west_007_f_n` | -36.7, -3.7 (ground -0.2) | ahead, 22:00 | pass |
| `west_008_b_d` | -31.7, -3.3 (ground -0.2) | behind, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `west_008_b_n` | -31.7, -3.3 (ground -0.2) | behind, 22:00 | pass |
| `west_008_f_d` | -31.7, -3.3 (ground -0.2) | ahead, 13:00 | pass |
| `west_008_f_n` | -31.7, -3.3 (ground -0.2) | ahead, 22:00 | pass |
| `west_009_b_d` | -26.8, -2.7 (ground -0.1) | behind, 13:00 | pass |
| `west_009_b_n` | -26.8, -2.7 (ground -0.1) | behind, 22:00 | pass |
| `west_009_f_d` | -26.8, -2.7 (ground -0.1) | ahead, 13:00 | pass |
| `west_009_f_n` | -26.8, -2.7 (ground -0.1) | ahead, 22:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `west_010_b_d` | -21.9, -3.7 (ground -0.1) | behind, 13:00 | pass |
| `west_010_b_n` | -21.9, -3.7 (ground -0.1) | behind, 22:00 | pass |
| `west_010_f_d` | -21.9, -3.7 (ground -0.1) | ahead, 13:00 | pass |
| `west_010_f_n` | -21.9, -3.7 (ground -0.1) | ahead, 22:00 | pass |
| `west_011_b_d` | -17, -4.8 (ground 0.0) | behind, 13:00 | pass |
| `west_011_b_n` | -17, -4.8 (ground 0.0) | behind, 22:00 | pass |
| `west_011_f_d` | -17, -4.8 (ground 0.0) | ahead, 13:00 | pass |
| `west_011_f_n` | -17, -4.8 (ground 0.0) | ahead, 22:00 | pass |
| `west_012_b_d` | -12.3, -6.3 (ground -0.1) | behind, 13:00 | pass |
| `west_012_b_n` | -12.3, -6.3 (ground -0.1) | behind, 22:00 | pass |
| `west_012_f_d` | -12.3, -6.3 (ground -0.1) | ahead, 13:00 | pass |
| `west_012_f_n` | -12.3, -6.3 (ground -0.1) | ahead, 22:00 | pass |
| `west_013_b_d` | -8.1, -9 (ground 0.0) | behind, 13:00 | pass |
| `west_013_b_n` | -8.1, -9 (ground 0.0) | behind, 22:00 | pass |
| `west_013_f_d` | -8.1, -9 (ground 0.0) | ahead, 13:00 | pass |
| `west_013_f_n` | -8.1, -9 (ground 0.0) | ahead, 22:00 | pass |
| `west_014_b_d` | -3.8, -11.4 (ground 0.0) | behind, 13:00 | pass |
| `west_014_b_n` | -3.8, -11.4 (ground 0.0) | behind, 22:00 | pass |
| `west_014_f_d` | -3.8, -11.4 (ground 0.0) | ahead, 13:00 | pass |
| `west_014_f_n` | -3.8, -11.4 (ground 0.0) | ahead, 22:00 | pass |
| `west_015_b_d` | -3.1, -11.7 (ground 0.0) | behind, 13:00 | pass |
| `west_015_b_n` | -3.1, -11.7 (ground 0.0) | behind, 22:00 | pass |
| `west_015_f_d` | -3.1, -11.7 (ground 0.0) | ahead, 13:00 | pass |
| `west_015_f_n` | -3.1, -11.7 (ground 0.0) | ahead, 22:00 | pass |
| `alley_000_b_d` | -3.1, -11.7 (ground 0.0) | behind, 13:00 | pass |
| `alley_000_b_n` | -3.1, -11.7 (ground 0.0) | behind, 22:00 | pass |
| `alley_000_f_d` | -3.1, -11.7 (ground 0.0) | ahead, 13:00 | pass |
| `alley_000_f_n` | -3.1, -11.7 (ground 0.0) | ahead, 22:00 | pass |
| `alley_001_b_d` | 1, -8.8 (ground 0.0) | behind, 13:00 | pass |
| `alley_001_b_n` | 1, -8.8 (ground 0.0) | behind, 22:00 | pass |
| `alley_001_f_d` | 1, -8.8 (ground 0.0) | ahead, 13:00 | pass |
| `alley_001_f_n` | 1, -8.8 (ground 0.0) | ahead, 22:00 | pass |
| `alley_002_b_d` | 4.2, -5.1 (ground -0.1) | behind, 13:00 | pass |
| `alley_002_b_n` | 4.2, -5.1 (ground -0.1) | behind, 22:00 | pass |
| `alley_002_f_d` | 4.2, -5.1 (ground -0.1) | ahead, 13:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_002_f_n` | 4.2, -5.1 (ground -0.1) | ahead, 22:00 | pass |
| `alley_003_b_d` | 7.3, -1.1 (ground -0.1) | behind, 13:00 | pass |
| `alley_003_b_n` | 7.3, -1.1 (ground -0.1) | behind, 22:00 | pass |
| `alley_003_f_d` | 7.3, -1.1 (ground -0.1) | ahead, 13:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_003_f_n` | 7.3, -1.1 (ground -0.1) | ahead, 22:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_004_b_d` | 11.8, 0 (ground -0.1) | behind, 13:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_004_b_n` | 11.8, 0 (ground -0.1) | behind, 22:00 | pass |
| `alley_004_f_d` | 11.8, 0 (ground -0.1) | ahead, 13:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_004_f_n` | 11.8, 0 (ground -0.1) | ahead, 22:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_005_b_d` | 16.8, 0.2 (ground -0.1) | behind, 13:00 | pass |
| `alley_005_b_n` | 16.8, 0.2 (ground -0.1) | behind, 22:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `alley_005_f_d` | 16.8, 0.2 (ground -0.1) | ahead, 13:00 | pass |
| `alley_005_f_n` | 16.8, 0.2 (ground -0.1) | ahead, 22:00 | pass |
| `alley_006_b_d` | 18.1, -3.6 (ground 0.0) | behind, 13:00 | pass |
| `alley_006_b_n` | 18.1, -3.6 (ground 0.0) | behind, 22:00 | pass |
| `alley_006_f_d` | 18.1, -3.6 (ground 0.0) | ahead, 13:00 | pass |
| `alley_006_f_n` | 18.1, -3.6 (ground 0.0) | ahead, 22:00 | pass |
| `alley_007_b_d` | 18.1, -6.6 (ground 0.0) | behind, 13:00 | pass |
| `alley_007_b_n` | 18.1, -6.6 (ground 0.0) | behind, 22:00 | pass |
| `alley_007_f_d` | 18.1, -6.6 (ground 0.0) | ahead, 13:00 | pass |
| `alley_007_f_n` | 18.1, -6.6 (ground 0.0) | ahead, 22:00 | pass |
| `hart_000_b_d` | -3.1, -11.7 (ground 0.0) | behind, 13:00 | pass |
| `hart_000_b_n` | -3.1, -11.7 (ground 0.0) | behind, 22:00 | pass |
| `hart_000_f_d` | -3.1, -11.7 (ground 0.0) | ahead, 13:00 | pass |
| `hart_000_f_n` | -3.1, -11.7 (ground 0.0) | ahead, 22:00 | pass |
| `hart_001_b_d` | 0, -15.5 (ground 0.1) | behind, 13:00 | pass |
| `hart_001_b_n` | 0, -15.5 (ground 0.1) | behind, 22:00 | pass |
| `hart_001_f_d` | 0, -15.5 (ground 0.1) | ahead, 13:00 | **primitive shape**: the Hart's window-box flowers are pastel cubes; **spike**: a fringe of grey spikes hangs from the sill above the window |
| `hart_001_f_n` | 0, -15.5 (ground 0.1) | ahead, 22:00 | **primitive shape**: the Hart's window-box flowers are pastel cubes; **spike**: a fringe of grey spikes hangs from the sill above the window |
| `hart_002_b_d` | 0, -15.6 (ground 0.1) | behind, 13:00 | pass |
| `hart_002_b_n` | 0, -15.6 (ground 0.1) | behind, 22:00 | pass |
| `hart_002_f_d` | 0, -15.6 (ground 0.1) | ahead, 13:00 | pass |
| `hart_002_f_n` | 0, -15.6 (ground 0.1) | ahead, 22:00 | pass |
| `ring_000_b_d` | 8.4, -9.5 (ground 0.0) | behind, 13:00 | pass |
| `ring_000_b_n` | 8.4, -9.5 (ground 0.0) | behind, 22:00 | pass |
| `ring_000_f_d` | 8.4, -9.5 (ground 0.0) | ahead, 13:00 | pass |
| `ring_000_f_n` | 8.4, -9.5 (ground 0.0) | ahead, 22:00 | pass |
| `ring_001_b_d` | 6.9, -4 (ground -0.1) | behind, 13:00 | pass |
| `ring_001_b_n` | 6.9, -4 (ground -0.1) | behind, 22:00 | pass |
| `ring_001_f_d` | 6.9, -4 (ground -0.1) | ahead, 13:00 | pass |
| `ring_001_f_n` | 6.9, -4 (ground -0.1) | ahead, 22:00 | pass |
| `ring_002_b_d` | 2.9, 0 (ground -0.1) | behind, 13:00 | pass |
| `ring_002_b_n` | 2.9, 0 (ground -0.1) | behind, 22:00 | pass |
| `ring_002_f_d` | 2.9, 0 (ground -0.1) | ahead, 13:00 | pass |
| `ring_002_f_n` | 2.9, 0 (ground -0.1) | ahead, 22:00 | pass |
| `ring_003_b_d` | -2.6, 1.5 (ground -0.1) | behind, 13:00 | pass |
| `ring_003_b_n` | -2.6, 1.5 (ground -0.1) | behind, 22:00 | pass |
| `ring_003_f_d` | -2.6, 1.5 (ground -0.1) | ahead, 13:00 | pass |
| `ring_003_f_n` | -2.6, 1.5 (ground -0.1) | ahead, 22:00 | pass |
| `ring_004_b_d` | -8.1, 0 (ground -0.1) | behind, 13:00 | pass |
| `ring_004_b_n` | -8.1, 0 (ground -0.1) | behind, 22:00 | pass |
| `ring_004_f_d` | -8.1, 0 (ground -0.1) | ahead, 13:00 | pass |
| `ring_004_f_n` | -8.1, 0 (ground -0.1) | ahead, 22:00 | pass |
| `ring_005_b_d` | -12.1, -4 (ground -0.1) | behind, 13:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `ring_005_b_n` | -12.1, -4 (ground -0.1) | behind, 22:00 | borderline **ruler edge**: a dark dead-straight strip (a gutter?) runs across the square |
| `ring_005_f_d` | -12.1, -4 (ground -0.1) | ahead, 13:00 | pass |
| `ring_005_f_n` | -12.1, -4 (ground -0.1) | ahead, 22:00 | pass |
| `ring_006_b_d` | -13.6, -9.5 (ground 0.0) | behind, 13:00 | pass |
| `ring_006_b_n` | -13.6, -9.5 (ground 0.0) | behind, 22:00 | pass |
| `ring_006_f_d` | -13.6, -9.5 (ground 0.0) | ahead, 13:00 | pass |
| `ring_006_f_n` | -13.6, -9.5 (ground 0.0) | ahead, 22:00 | pass |
| `ring_007_b_d` | -12.1, -15 (ground 0.0) | behind, 13:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `ring_007_b_n` | -12.1, -15 (ground 0.0) | behind, 22:00 | **flat colour**: free-standing posts in the street are plain black boxes with no texture |
| `ring_007_f_d` | -12.1, -15 (ground 0.0) | ahead, 13:00 | pass |
| `ring_007_f_n` | -12.1, -15 (ground 0.0) | ahead, 22:00 | pass |
| `ring_008_b_d` | -8.1, -19 (ground 0.1) | behind, 13:00 | **stretched**: the stall's table top shows the wood grain pulled into straight stripes |
| `ring_008_b_n` | -8.1, -19 (ground 0.1) | behind, 22:00 | pass |
| `ring_008_f_d` | -8.1, -19 (ground 0.1) | ahead, 13:00 | pass |
| `ring_008_f_n` | -8.1, -19 (ground 0.1) | ahead, 22:00 | pass |
| `ring_009_b_d` | -2.6, -20.5 (ground 0.1) | behind, 13:00 | not a player view: inside the Hart's walls |
| `ring_009_b_n` | -2.6, -20.5 (ground 0.1) | behind, 22:00 | not a player view: inside the Hart's walls |
| `ring_009_f_d` | -2.6, -20.5 (ground 0.1) | ahead, 13:00 | not a player view: inside the Hart's walls |
| `ring_009_f_n` | -2.6, -20.5 (ground 0.1) | ahead, 22:00 | not a player view: inside the Hart's walls |
| `ring_010_b_d` | 2.9, -19 (ground 0.1) | behind, 13:00 | not a player view: inside the Hart's walls |
| `ring_010_b_n` | 2.9, -19 (ground 0.1) | behind, 22:00 | not a player view: inside the Hart's walls |
| `ring_010_f_d` | 2.9, -19 (ground 0.1) | ahead, 13:00 | not a player view: inside the Hart's walls |
| `ring_010_f_n` | 2.9, -19 (ground 0.1) | ahead, 22:00 | not a player view: inside the Hart's walls |
| `ring_011_b_d` | 6.9, -15 (ground 0.1) | behind, 13:00 | pass |
| `ring_011_b_n` | 6.9, -15 (ground 0.1) | behind, 22:00 | pass |
| `ring_011_f_d` | 6.9, -15 (ground 0.1) | ahead, 13:00 | pass |
| `ring_011_f_n` | 6.9, -15 (ground 0.1) | ahead, 22:00 | pass |
