# New spoken lines (fork-q1)

Every line below is new on-screen text added by the quest/level work. Speaker id is the NPC key in `TALK`/`NPC`
(`*` = any villager, `ixSay`/`IX.SAY` comment prefixed to that speaker's own node when its condition holds).
No existing line was edited. A line with no recorded voice shows as a subtitle. Letters, notes, journal pages and
item descriptions are READING text (no voice); they are listed at the end for completeness.

Text is exact. `\n\n` marks a paragraph break inside one node.

## Spoken (new nodes and options)

### hale (Warden Hale; new option on his existing greeting node, greeting itself untouched)
- option: You look like a man with something on his mind.
- Finn pulled a man out of the lake at first light. He’s on a bier at the wharf, south end of the town. Go and look, if you’ve the stomach, before the gossips make a story of him.
- `haleJournal` (after the journal):
  - That’s Corwin’s hand. Alive, then, or he was. Let me see.\n\nBread. Fifty years of bread, in a cave on the shore. I barred that door and told myself it was to keep them out.
  - option: What did you know?
  - That something went wrong below, before I wore this helmet. That Rowan went out to the shore every dawn and never said why. I didn’t ask. A man can keep a gate for thirty years that way.
  - option: What now?
  - Not here. Rowan knows the way to the lake cave; he’s walked it with a pail more mornings than I’ve slept. Go and ask him, and don’t let him tell you it’s nothing.
  - option: Keep it. (reply) Keep it. I’ll find Rowan.
- crime node (also spoken by ivo):
  - Hold. That’s theft, in front of a witness, and I’ll not have it in my town. The fine is N gold, or you hand it back, or you sleep in the cell and think about it.
  - option: Hand it back. -> Good. That’s the end of it. This time.
  - option: Pay the fine. (N gold) -> Paid. Keep your hands in your pockets in future.
  - no coin -> You haven’t the coin. Then it’s the cell. Come on.  (option: Lead on.)
  - option: Go quietly.
  - no cell -> There’s no cell to hold you. Go on, then.

### maren
- option: I found this on a dead man at the wharf.
- Brass, and a number. OM fourteen: the Old Mine, Dunstan Pell. He dug under Corwin, a good while back.
- option: He wasn’t drowned.
- No. Dry as a bone inside and thin as a rake: he walked a long way on nothing, in the dark. That’s no lake’s work.
- option: Where did he come from?
- The door in the south-west cliffs. Hale barred it, but the Sexton kept the key, and old Sextons keep everything. Look in the crypt under the chapel.
- comment: You’re bleeding on my floor. Sit.

### aldous
- option: The Sexton’s key. Where is it kept?
- There’s a vestment chest in the sacristy that I’ve never had the heart to open. The Sexton’s things are in it. The crypt gate under the nave has a lock to match.
- comment: The Dawn keep you. You look as though you have seen the dead.

### finn
- option: The man you found.
- First light, face down in the reeds. The lake gives drowned men back swollen. This one was thin as a rake and dry as kindling. Whatever he was, he walked to the water; he didn’t fall in.
- comment: Still thinking about that man, aren’t you. So am I.

### pip
- option: What’s the crowd at the wharf?
- A man under a sheet! Hale said not to look. I looked. He’s got silver in his teeth.

### marta
- option: A miner’s lantern. (12 gold)
- You’ve one already, dear. Don’t be greedy with light.
- Fill it before you go and mind the oil. Where you’re going, you’ll want it.
- comment: Odd thing to carry. I’ll not ask.

### rowan
- Sit down, you’re making me tired. ... Hale has read it, then. I thought he might. I thought it would be me they came for one day.\n\nThe cave on the lake shore. The cellar of the Hart. I’ll tell you the rest, but not on my feet, and not today.
- option: I’ll be back.

### greta
- option: A bowl of stew. (3 gold)  -> Eat it while it’s hot. I don’t do cold.  (short of coin: Three gold, love. Your purse says otherwise.)
- option: A bed for the night. (4 gold) -> Up the stairs, the bed by the window. Sleep till you’re done.  (short: Four gold, love, and I’ll not haggle with a purse that light.)
- comment: Off down a hole, love? I’ll keep the bed made.

### comments (prefixed to the speaker's own node, at most once per half hour)
- `*` (anyone), after a theft: I heard about the business with the shop. Keep your hands to yourself.
- `*`, 22:00 to 04:30: You’re about late. Mind the dark.
- `*`, carrying 120 gold or more: You’re jingling, friend. Mind the lanes after dusk.
- `*`, mine door open and Corwin not yet found: They say the old mine door is open. Folk are talking.
- hale, wielding a blade of damage 21 or more: That’s a fine blade. Don’t draw it in my square.
- brandt, wielding the iron sword: Good. It sits well in your hand. My work.
- brandt, wielding the silver pick: Where did you get that? That’s my dies, fifty years back. Old Mine steel.
- ivo, carrying a lantern: A lantern by day. Either you’re lost, or you’re going somewhere I’d not.

### bystander shouts (toasts)
- <name>: “Oi! Put that back! Guards!”   (the witness of a theft)
- Outlaws! They have seen you.   (a foe's alarm)

## Toasts and system lines (subtitle style, no speaker)
- This bed isn’t yours. Greta at the bar lets rooms.
- The Sexton’s key turns with a groan. The bar lifts out of its brackets.
- Barred from the far side. Iron and oak: you will not shift it. Somebody, once, kept a key for it.
- You trim the wick and fill the lantern from a flask. / The lantern is dry. Without oil the dark is complete. / The lantern gutters. It wants oil. / You douse the lantern. / You light the lantern.
- The cord snaps. A slab of rock comes down on you. / You cut the cord. The slab stays up on its rope.
- Locked. A brass lock, worn bright. The man who counted heads will have the key.
- Locked. A small, well-oiled lock: someone cares what is in here. / Locked. You would need a key, or a steady hand and a pick.
- The pick snaps as the lock gives. / The pick snaps in the lock.
- Nothing but damp stave and a smell of apples. / Nothing. Dust, and a moth.
- Taken: <items> / Empty
- You sit. Any move stands you up.
- You wake on straw. The door is locked. / You slip out while the watch is at breakfast. They will remember. / Hale lets you out at first light. “Don’t make me do that twice.”
- The stew is hot and thick: +40 health
- Act one ends. The way on is under the Honeyed Hart.

## Reading text (no voice)
Items: Miner’s tally token, Sexton’s mine key, Miner’s lantern, Sexton’s ledger, Corwin’s journal, Lamp oil, The Foreman’s key, Silverthread, Tallow candle, Hard cheese, Flint and steel, Pewter cup, Spool of thread, Handful of nails, Dried herbs, Plain silver ring, Lockpick, Bowl of stew (descriptions in `82_story.js`, `82b_interact.js`, `94_mine.js`).

Notes and letters (`IX` book pickups): the miller’s tally, a letter folded small (T. to Wren), Greta’s ale, a note under a candlestick, a page of gossip, a child’s drawing, the smith’s order book, the gate roster, the burial register, Marta’s invoice, a scrawled note (Tobin), Maren’s margin note, a will unsigned, a merchant’s letter, Finn’s log, a prayer card, Pip’s list, a scrap with a smudge (D. Pell), the bread cave map, the Magpie notice. Also: the drowned man’s inspection text (wharf), the Sexton’s ledger, Corwin’s mine journal.
