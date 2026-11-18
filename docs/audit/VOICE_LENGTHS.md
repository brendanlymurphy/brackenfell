# Recorded lines: length against text (for the owner's ear)

Made by `python3 test/audit/voice_lengths.py` from branch `fork-cull` (the only branch with the 529 recordings; `main` and `threejs` have 254).
Each file decoded with ffmpeg; silence is anything under -45 dB for at least 0.12 s. Characters per second counts the text's characters over the clip
with its leading and trailing silence removed. **Nothing was listened to**: this list only says which clips to listen to first.

| | |
|---|---|
| Lines with a file | 529 (0 missing) |
| Characters per second: median / 10th / 90th percentile | 12.6 / 8.9 / 15.8 |
| Clips under 0.6 s | 2 |
| More than 0.5 s of silence at the start or the end | 3 |
| A pause of more than 1.5 s inside the line | 6 |

A natural reading pace is around 14 to 16 characters per second. Much faster usually means words dropped or rushed; much slower means a long pause,
a drawn-out reading, or something said that is not in the text (a model once read its acting direction aloud).

## The 20 fastest

| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |
|---|---|---|---|---|---|---|---|
| tobin | 1.18 | 21 | **19.8** | 0.0 / 0.12 | 0.0 | Race you to the well! | `259c06eb36bd45.m4a` |
| greta | 1.86 | 34 | **19.4** | 0.0 / 0.11 | 0.0 | There's stew on, if you're hungry. | `557d637a87ffbf.m4a` |
| greta | 1.44 | 25 | **18.9** | 0.0 / 0.12 | 0.0 | What can I get you, love? | `48db997fec9363.m4a` |
| alison | 4.74 | 87 | **18.9** | 0.0 / 0.13 | 0.31 | Greta at the Hart is always after someone to run an errand. She pays in coin and a bed. | `3e18f2cd091adb.m4a` |
| alaric | 1.43 | 27 | **18.9** | 0.0 / 0.0 | 0.0 | I have a tincture for that. | `01eae48c7b7a0a.m4a` |
| godwin | 0.88 | 14 | **18.6** | 0.0 / 0.13 | 0.0 | Mind the rack. | `16a17744276002.m4a` |
| lambert | 1.69 | 31 | **18.3** | 0.0 / 0.0 | 0.0 | Then he has not long to say it. | `506e14bc2eb2c2.m4a` |
| stephen | 6.47 | 117 | **18.1** | 0.0 / 0.0 | 0.29 | Guardsman Ivo and I take a cup at the Hart most nights. He walks the wall and I mend what the wall does to his | `32aa42924ea3a8.m4a` |
| bridget | 3.98 | 70 | **18.1** | 0.0 / 0.11 | 0.45 | She looks at everyone. She is deciding whether they drink at the Hart. | `5afd6bf7e48b5f.m4a` |
| gillian | 5.06 | 89 | **18.0** | 0.0 / 0.12 | 0.45 | Take a seat and a feather. If you are talking to me you can strip quills while you do it. | `c0340b973bcdff.m4a` |
| tobin | 2.02 | 34 | **17.9** | 0.0 / 0.12 | 0.0 | Bet you can’t beat me to the well! | `599177e7ac3248.m4a` |
| gilbert | 6.19 | 109 | **17.9** | 0.0 / 0.11 | 0.46 | There is silver paid at the board for outlaws put down on the passes. I put some of that silver there myself. | `b59bd439b32e48.m4a` |
| randal | 0.56 | 10 | **17.9** | 0.0 / 0.0 | 0.0 | What then? | `72ad13a38f67a6.m4a` |
| wilmot | 6.4 | 113 | **17.7** | 0.0 / 0.0 | 0.62 | Hilda is at her loom by the river. She and the smith have a quarrel over cloth that neither of them will let l | `64a956300c60df.m4a` |
| pip | 1.55 | 25 | **17.6** | 0.0 / 0.13 | 0.0 | Mum says I have to go in. | `48b22301be9f48.m4a` |
| sabina | 4.98 | 85 | **17.5** | 0.0 / 0.12 | 0.68 | You are the one who got the bell ringing. I slept through the first one out of habit. | `72f7ee4349b5ca.m4a` |
| avice | 3.72 | 63 | **17.4** | 0.0 / 0.1 | 0.0 | Your Humphrey seen my Tilly’s face when the Varrow boy goes by? | `16f2e81df7276c.m4a` |
| greta | 1.2 | 19 | **17.4** | 0.0 / 0.11 | 0.0 | Good morning, love. | `efd862ac289e92.m4a` |
| mercy | 6.79 | 115 | **17.2** | 0.0 / 0.12 | 0.79 | The roads will be safer or they will not. Either way there is a man out there with one ear who is still my bro | `62ecb6e821a666.m4a` |
| alaric | 2.33 | 38 | **17.2** | 0.0 / 0.12 | 0.0 | A sovereign decoction for the vapours. | `7ef07a7e0e9215.m4a` |

## The 20 slowest

| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |
|---|---|---|---|---|---|---|---|
| finn | 3.08 | 10 | **3.2** | 0.0 / 0.0 | 0.84 | Shh. Fish. | `bbd32cf8b11ce6.m4a` |
| brandt | 2.09 | 9 | **4.3** | 0.0 / 0.0 | 0.0 | Hm. Late. | `46f7f7d459f00a.m4a` |
| edda | 2.19 | 9 | **4.3** | 0.0 / 0.12 | 0.0 | Long day. | `e6ec54c0ee1e5d.m4a` |
| lark | 3.19 | 14 | **4.6** | 0.0 / 0.12 | 0.0 | Ooh. Dramatic. | `d758c9056589bd.m4a` |
| maren | 2.66 | 15 | **5.6** | 0.0 / 0.0 | 0.77 | Cold coming in. | `820c59dd2f625f.m4a` |
| brandt | 4.15 | 25 | **6.0** | 0.0 / 0.0 | 0.48 | Done for the day, nearly. | `8405517d5c6a55.m4a` |
| bram | 5.78 | 35 | **6.1** | 0.0 / 0.0 | 0.29 | Apples! Cabbages! Oh. Sorry. Habit. | `0c9bf8050668e6.m4a` |
| wren | 4.68 | 30 | **6.4** | 0.0 / 0.0 | 1.09 | Hare. Grouse. Silence, mostly. | `08ad837947a298.m4a` |
| idony | 4.49 | 28 | **6.4** | 0.0 / 0.11 | 1.61 | Bell’s late. No. Bell’s not. | `5ffffea0c6cc3c.m4a` |
| lark | 1.84 | 11 | **6.4** | 0.0 / 0.11 | 0.29 | Sleep well. | `f235a30aa5d621.m4a` |
| edda | 1.61 | 8 | **6.6** | 0.0 / 0.4 | 0.22 | Morning. | `7e3b9fafe89c28.m4a` |
| brandt | 6.72 | 44 | **6.7** | 0.0 / 0.12 | 1.09 | Find the boy. Tobin. Fair hair, guilty face. | `e7f3223cf5bbcc.m4a` |
| lambert | 2.31 | 15 | **6.7** | 0.0 / 0.08 | 0.6 | Hm. A stranger. | `7ec571ec865cc6.m4a` |
| ivo | 2.79 | 18 | **6.7** | 0.0 / 0.11 | 0.13 | All quiet, so far. | `4a5165298f7bda.m4a` |
| aldous | 3.56 | 25 | **7.0** | 0.0 / 0.0 | 0.0 | The evening bell is near. | `123f48e245b3fc.m4a` |
| maren | 5.0 | 35 | **7.1** | 0.0 / 0.1 | 0.53 | Oh, you foolish child. Put it away. | `dba70dc87fa95d.m4a` |
| anselm | 2.63 | 19 | **7.2** | 0.0 / 0.0 | 0.51 | Good wool day. Dry. | `0a9ca915b2a038.m4a` |
| sabina | 2.62 | 18 | **7.2** | 0.0 / 0.12 | 0.47 | Lark! Two winters! | `1ca0a1da545d6a.m4a` |
| simon | 1.63 | 11 | **7.3** | 0.0 / 0.12 | 0.47 | Ned! Sacks! | `d16a68ae8a3373.m4a` |
| wenn | 1.79 | 13 | **7.3** | 0.0 / 0.0 | 0.28 | Twenty boats! | `7e90e636d6d17d.m4a` |

## Silence of more than 0.5 s at either end

| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |
|---|---|---|---|---|---|---|---|
| godwin | 7.78 | 83 | **13.4** | 0.0 / 1.61 | 0.21 | If I look half asleep it is because I am. The bread is made while you are dreaming. | `dafaefaaa37543.m4a` |
| godwin | 9.87 | 110 | **12.9** | 1.28 / 0.1 | 0.88 | The Elder had six loaves off me every morning, paid by the month. Three weeks back he stopped. Never said why. | `4de2dd27385b83.m4a` |
| godwin | 13.29 | 120 | **9.9** | 1.06 / 0.13 | 0.93 | Godwin Hobb. My mother baked at that oven and her mother before. Osric grinds it, I bake it, you eat it. That  | `b4dd41f03dbf28.m4a` |

## Pauses of more than 1.5 s inside a line

| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |
|---|---|---|---|---|---|---|---|
| aldous | 16.26 | 137 | **8.5** | 0.0 / 0.11 | 2.68 | Hemp, and well laid! Give me one moment in the tower... there. It is done. Would you ring it? It ought to be a | `f1ae115886290a.m4a` |
| aldous | 7.46 | 61 | **8.2** | 0.0 / 0.0 | 1.65 | The Dawn keep you. You look as though you have seen the dead. | `db6be734f187b7.m4a` |
| brandt | 4.6 | 40 | **8.7** | 0.0 / 0.0 | 1.64 | Borrowed it. He was a knight, I am told. | `028a00984080fd.m4a` |
| idony | 4.49 | 28 | **6.4** | 0.0 / 0.11 | 1.61 | Bell’s late. No. Bell’s not. | `5ffffea0c6cc3c.m4a` |
| rowan | 32.83 | 337 | **10.3** | 0.0 / 0.11 | 1.55 | It was never for their bellies. It was so that someone remembered them. Every dawn a loaf and a pail, left on  | `fe6b127901c445.m4a` |
| rosalind | 7.74 | 82 | **10.7** | 0.0 / 0.1 | 1.54 | I heard it. All the way up here, on the wind. I stood in the yard till it stopped. | `82c783d3c06cc9.m4a` |

## Clips under 0.6 s

| Speaker | Clip s | Characters | Chars per s of speech | Silence start / end s | Longest pause s | Text (start) | File |
|---|---|---|---|---|---|---|---|
| randal | 0.56 | 10 | **17.9** | 0.0 / 0.0 | 0.0 | What then? | `72ad13a38f67a6.m4a` |
| wren | 0.47 | 3 | **7.8** | 0.0 / 0.08 | 0.0 | Hm. | `b4ae530bc5c2a8.m4a` |

## Pace by speaker (median characters per second)

| Speaker | Lines | Median | Fastest | Slowest |
|---|---|---|---|---|
| gillian | 1 | 18.0 | 18.0 | 18.0 |
| stephen | 10 | 15.45 | 18.1 | 8.3 |
| avice | 10 | 15.3 | 17.4 | 9.7 |
| gilbert | 8 | 14.899999999999999 | 17.9 | 10.6 |
| wilmot | 8 | 14.85 | 17.7 | 9.2 |
| pip | 11 | 14.7 | 17.6 | 9.4 |
| mercy | 8 | 14.65 | 17.2 | 9.5 |
| randal | 10 | 14.55 | 17.9 | 12.9 |
| basilia | 8 | 14.5 | 16.0 | 13.1 |
| tilly | 9 | 14.4 | 15.6 | 10.4 |
| barnaby | 8 | 14.350000000000001 | 16.2 | 9.2 |
| elinor | 10 | 14.35 | 17.0 | 9.2 |
| felice | 7 | 14.3 | 16.3 | 13.6 |
| joyce | 8 | 14.25 | 16.1 | 11.2 |
| lambert | 10 | 14.25 | 18.3 | 6.7 |
| bridget | 10 | 14.25 | 18.1 | 8.8 |
| greta | 42 | 14.149999999999999 | 19.4 | 9.0 |
| will | 6 | 13.899999999999999 | 16.7 | 11.4 |
| godwin | 8 | 13.7 | 18.6 | 9.9 |
| anselm | 8 | 13.7 | 14.9 | 7.2 |
| marta | 18 | 13.649999999999999 | 16.5 | 9.6 |
| alaric | 10 | 13.600000000000001 | 18.9 | 8.9 |
| alison | 8 | 13.3 | 18.9 | 9.3 |
| tobin | 9 | 13.2 | 19.8 | 8.0 |
| hugh | 10 | 13.1 | 16.6 | 10.3 |
| sabina | 8 | 13.0 | 17.5 | 7.2 |
| petronel | 10 | 13.0 | 15.1 | 9.3 |
| jordan | 8 | 12.55 | 14.3 | 11.8 |
| simon | 8 | 12.3 | 14.1 | 7.3 |
| tom | 6 | 12.25 | 16.1 | 10.5 |
| peter | 8 | 12.1 | 14.0 | 11.7 |
| hale | 27 | 12.0 | 13.6 | 7.6 |
| fulk | 8 | 11.85 | 15.5 | 7.8 |
| lark | 8 | 11.8 | 15.5 | 4.6 |
| idony | 8 | 11.6 | 14.2 | 6.4 |
| wenn | 11 | 11.6 | 14.8 | 7.3 |
| ivo | 14 | 11.55 | 17.0 | 6.7 |
| rosalind | 8 | 11.45 | 16.5 | 9.2 |
| osric | 8 | 11.399999999999999 | 15.9 | 10.6 |
| rowan | 27 | 10.9 | 12.7 | 7.9 |
| humphrey | 8 | 10.899999999999999 | 14.2 | 7.7 |
| brandt | 27 | 10.7 | 15.6 | 4.3 |
| edda | 7 | 10.7 | 13.2 | 4.3 |
| wren | 7 | 10.7 | 13.3 | 6.4 |
| bram | 8 | 10.65 | 12.4 | 6.1 |
| aldous | 15 | 10.4 | 14.1 | 7.0 |
| hilda | 7 | 10.3 | 15.0 | 9.7 |
| maren | 17 | 9.5 | 12.9 | 5.6 |
| finn | 11 | 9.0 | 13.6 | 3.2 |
