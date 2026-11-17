# Voice: every line shown while the play bot played by input

Made by `node test/audit/voicebot.mjs --run ...` then `python3 test/audit/voice_table.py`. A line counts as having a recording when the game found a file for it in `audio/voice/manifest.json` and accepted it for playing with the audio context running. Headless: nobody heard anything; whether it sounds right is not tested.

Lines shown (counting repeats): 114. Distinct lines: 59. With a recording: 44. Part silent: 5. Silent: 10.
Barks attempted near the player: 6, of which played: 5. Refused (villager has no barks): ['Nell Marsh'].

## Silent and part-silent lines

| Speaker | Text | State | Cause |
|---|---|---|---|
| hollow | Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before them is bare. The old loaves on it are green and the candle ends are cold, and th | SILENT (0 of 2 paragraphs) | speaker has no voice in the cast and no line in the plan |
| hale | There’s bread on the Wharf every dawn now. My mother would have cried to see it. /  / Road’s quiet. Just how I like it. | PART SILENT (1 of 2 paragraphs) | a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker |
| greta | There’s bread on the Wharf every dawn now. My mother would have cried to see it. /  / What can I get you, love? | PART SILENT (1 of 2 paragraphs) | a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker |
| hollow | Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before them is bare. The old loaves on it are green and the candle ends are cold, and th | SILENT (0 of 2 paragraphs) | speaker has no voice in the cast and no line in the plan |
| board | Notices, pinned over notices. Two of them are in a clean hand and have not yellowed. | SILENT (0 of 1 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| board | WANTED: four outlaws put down on the passes. Thirty-five gold, paid at the board. /  / You take the notice. | SILENT (0 of 2 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| rowan | You’re jingling, friend. Mind the lanes after dusk. /  / Brackenfell remembers its friends. Stay as long as you like. Stay for good, if the road will let you. | PART SILENT (1 of 2 paragraphs) | a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker |
| board | Your notice is still on you. | SILENT (0 of 1 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| board | Paid. That notice comes down. There will be another like it tomorrow. | SILENT (0 of 1 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| hale | You’re jingling, friend. Mind the lanes after dusk. /  / You lit the harvest fire. I never thought to see it burn again. You’re one of us now, whether you like it or not. | PART SILENT (1 of 2 paragraphs) | a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker |
| board | WANTED: three flasks of lamp oil for the gate. Thirty gold. Marta has it. /  / You take the notice. | SILENT (0 of 2 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| board | Notices, pinned over notices. Two of them are in a clean hand and have not yellowed. /  / A bare nail where today’s paid work hung. It will be pinned up again tomorrow. | SILENT (0 of 2 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| hale | I heard about the business with the shop. Keep your hands to yourself. /  / Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is 20 gol | SILENT (0 of 2 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |
| marta | I heard about the business with the shop. Keep your hands to yourself. /  / Quill’s Sundries. If I don’t have it, you don’t need it. | PART SILENT (1 of 2 paragraphs) | a remark from IX.SAY is shown in front of the recorded line; the remark itself has no recording for this speaker |
| hale | Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is 20 gold, or you hand it back, or you sleep in the cell and think about it. | SILENT (0 of 1 paragraphs) | no entry in audio/voice/manifest.json for this speaker and text |

## All distinct lines

| Speaker | Text (start) | State |
|---|---|---|
| osric | Greta’s malt! I’d clean forgot, what with the wheel groaning all week. Here, take it, and  | recording |
| greta | That’s the malt! Oh, bless you. There’ll be ale by week’s end. Here, for your trouble, and | recording |
| greta | If you’ve a mind to stay useful: Brandt has been storming about since his hammer went miss | recording |
| brandt | Unless you’ve come to tell me where my hammer is, I’ve work to do. My best cross-peen, gon | recording |
| brandt | Hm. Start with the boy. He’s always underfoot in the square, when he should be at the bell | recording |
| tobin | The hammer? I, um. I only borrowed it! I was playing knights up at the old watchtower, and | recording |
| brandt | That’s her! Where was she? The watchtower? I’ll tan his... no. No, I was a boy once, and t | recording |
| maren | Hm. Young eyes. Good. The frost came early and my stores are thin. I need frostcaps: pale  | recording |
| maren | Five, and not one bruised! You have gentle hands. Take this tonic. It will keep the mounta | recording |
| aldous | The peace of the Dawn upon you. Forgive the quiet. Our bell rope rotted through at midsumm | recording |
| aldous | Would you? Marta keeps good hemp at her shop on the square. The Dawn remembers a kindness. | recording |
| marta | Quill’s Sundries. If I don’t have it, you don’t need it. | recording |
| marta | Thirty feet of the best. Don’t hang anything you can’t lift. | recording |
| aldous | Hemp, and well laid! Give me one moment in the tower... there. It is done. Would you ring  | recording |
| rowan | The inn has its ale, the forge its hammer, Maren her remedies, and the bell its voice. Do  | recording |
| maren | Since you are the sort who walks: I have a tea I used to make from three herbs and my knee | recording |
| maren | Brass, and a number. OM fourteen: the Old Mine, Dunstan Pell. He dug under Corwin, a good  | recording |
| maren | No. Dry as a bone inside and thin as a rake: he walked a long way on nothing, in the dark. | recording |
| maren | The door in the south-west cliffs. Hale barred it, but the Sexton kept the key, and old Se | recording |
| marta | You’ve one already, dear. Don’t be greedy with light. | recording |
| hale | That’s Corwin’s hand. Alive, then, or he was. Let me see. /  / Bread. Fifty years of bread | recording |
| hale | That something went wrong below, before I wore this helmet. That Rowan went out to the sho | recording |
| hale | Not here. Rowan knows the way to the lake cave; he’s walked it with a pail more mornings t | recording |
| rowan | Sit down, you’re making me tired. ... Hale has read it, then. I thought he might. I though | recording |
| rowan | Tomorrow, I said. An old man needs a night to find the words. Sleep, and come back. | recording |
| rowan | Sit. You will want it from the start, and you will not like where it starts. /  / Fifty ye | recording |
| rowan | It was never for their bellies. It was so that someone remembered them. Every dawn a loaf  | recording |
| rowan | I stopped it. Three weeks ago. Greta has found a buyer who pays double and wants the silve | recording |
| rowan | Go the way Greta’s people ran the silver out. The Hart’s cellar has a wall that was never  | recording |
| hollow | Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before t | SILENT |
| rowan | The bread goes out at dawn. I carry it myself, and I am too old to be told it is a kindnes | recording |
| hale | There’s bread on the Wharf every dawn now. My mother would have cried to see it. /  / Road | PART SILENT |
| hale | Last village before the Greyspine passes. Sixty souls, one inn, one forge, and a chapel be | recording |
| greta | There’s bread on the Wharf every dawn now. My mother would have cried to see it. /  / What | PART SILENT |
| greta | Warm, and sweet with heather honey. The room feels friendlier already. | recording |
| hollow | Twelve stand in a row at the water’s edge, and not one of them breathes. The slab before t | SILENT |
| greta | You’re a treasure. Over the bridge east of the square, then follow the river downstream. Y | recording |
| brandt | She rings true again. Hear that? That’s the sound of a village with a working forge. | recording |
| brandt | Let’s see it, then. | recording |
| board | Notices, pinned over notices. Two of them are in a clean hand and have not yellowed. | SILENT |
| board | WANTED: four outlaws put down on the passes. Thirty-five gold, paid at the board. /  / You | SILENT |
| rowan | You’re jingling, friend. Mind the lanes after dusk. /  / Brackenfell remembers its friends | PART SILENT |
| rowan | Safer than most. But there has been smoke in the pines north-west of the gate these three  | recording |
| rowan | Brackenfell remembers its friends. Stay as long as you like. Stay for good, if the road wi | recording |
| rowan | Then the children can pick berries at the wood’s edge again. This was my father’s, and it  | recording |
| board | Your notice is still on you. | SILENT |
| board | Paid. That notice comes down. There will be another like it tomorrow. | SILENT |
| brandt | Hah! Not a scratch on them. As promised: an arming sword, drawn out this spring and waitin | recording |
| hale | You’re jingling, friend. Mind the lanes after dusk. /  / You lit the harvest fire. I never | PART SILENT |
| hale | Five, by my count and yours. Paid in full. You’ve done the valley a turn, and I’ll not for | recording |
| marta | Whale oil. It stinks and it burns. Don’t spill it near the candles. | recording |
| board | WANTED: three flasks of lamp oil for the gate. Thirty gold. Marta has it. /  / You take th | SILENT |
| board | Notices, pinned over notices. Two of them are in a clean hand and have not yellowed. /  /  | SILENT |
| hale | I heard about the business with the shop. Keep your hands to yourself. /  / Hold. That’s t | SILENT |
| hale | Good. That’s the end of it. This time. | recording |
| marta | I heard about the business with the shop. Keep your hands to yourself. /  / Quill’s Sundri | PART SILENT |
| marta | Not today, dear. Hale has been asking after you, and I’ll not buy from a name he is asking | recording |
| hale | Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is 20 | SILENT |
| greta | What can I get you, love? | recording |

Distinct lines per speaker in this play-through: rowan 12, hale 10, greta 6, brandt 6, maren 6, marta 6, board 6, aldous 3, hollow 2, osric 1, tobin 1
