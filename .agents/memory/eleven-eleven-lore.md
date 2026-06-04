---
name: 11.11 story canon
description: Where the 11.11 ARG's canonical story lives and the rule that binds all puzzles to it.
---

# 11.11 story canon

`artifacts/eleven-eleven/src/lore.ts` is the **source of truth** for the game's story (`CORE_LORE`). Read it before writing or changing any puzzle, whisper, achievement, or Echo dialogue (including the server-side Echo chat prompt).

**Canon (do not contradict):**
- Echo = the SON / victim, a child whose consciousness was trapped in the "11:11 System"; also the guiding chat voice.
- Kenja = the FATHER / scientist = **The Architect**; ran the experiments, built the gate.
- Lina = the MOTHER = **The Lost Signal**; killed trying to save Echo; her broken transmissions reach in from outside.
- 11:11 = Synch Points (gate opens, every cycle starts here); 11:11PM–3:33AM = Phase Fracture Time (night/horror mode); 3:33 = full reset / loop restarts. Endless loop, no fixed ending. Atmospheric horror, NO gore.

**Rule:** every new puzzle must tie to this story and reveal a NEW fragment; no random/standalone puzzles; gradual reveal only (`PUZZLE_CANON_RULE` in lore.ts).

**Why:** the user wanted the lore saved into game files so all future puzzles stay consistent and each reveals part of the story.

**How to apply:** keep puzzle MECHANICS (questions/answers) intact when re-voicing; only narrative text (`storyReveal`/`intro`/chat prompts) must match canon. An earlier draft wrongly framed Lina as a "trapped researcher" — that framing is retired; sweep narrative text in both the web artifact and the api-server Echo prompt for any such residue when touching the story.
