# Inbox: the coordinator's messages to each session, without the owner as the postman

The owner is not always there to paste messages. From now on:

- **Coordinator to you:** `docs/inbox/<YOU>.md` on branch `threejs` (OG, NEW, THREE, FOUR). Read it at the start of every task and whenever
  you finish one: `git fetch origin threejs && git show origin/threejs:docs/inbox/<YOU>.md`. The newest entry is at the top, dated (UTC).
  A push that changes only `docs/` runs no gate, so this costs nothing.
- **You to the coordinator:** `docs/reports/<YOU>.md` on your own branch, newest entry at the top, dated, then push. Same content as the
  reports you gave the owner: hash, what changed, counts before and after, picture paths in the branch, what you could not check, and
  any decision you need. The coordinator fetches every branch at each check-in (about hourly at night).
- A decision you need and do not have: take the reading that is easiest to undo, say which you took at the top of the report, and carry on
  with the next item. Do not stop and wait.
- Merge candidates: merge `origin/threejs`, run `gh workflow run gate --ref <your branch> -f mode=full`, and put the hash and run number
  in your report. The coordinator merges and publishes; never push to `threejs` or `main`.
- The owner still relays anything he wants to say himself, and his word outranks this file.
