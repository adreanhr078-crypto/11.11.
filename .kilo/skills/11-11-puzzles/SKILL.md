---
name: 11-11-puzzles
description: >-
  Create, review, fix, or extend any 11.11 puzzle surface: puzzle data, puzzle
  types, PuzzleScreen, story-puzzles, puzzle-hub, Fragment Law canon, puzzle
  achievement linkage, or puzzle accessibility. Use before authoring new puzzles
  or changing puzzle behavior; enforce story-reveal canon and accessible
  completion moments. Do not modify frozen systems (achievements, endings,
  cinematics) unless the task explicitly scopes puzzle-only changes within
  allowed boundaries.
metadata:
  category: game-development
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-puzzles
    license: project-internal
---

# 11.11 Puzzles Skill

Puzzles are the primary way players reconstruct Echo's story. Every puzzle must tie to canon, reveal a fragment, and produce a polished accessible completion moment using the existing authoritative reward receipt.

## Active implementation facts

- **Data model:** `src/puzzles.ts` defines `Puzzle`, `EntityMeta`, and `ENTITIES` for `echo`, `watcher`, `signal`, and `architect`. Puzzles are bilingually typed (`ar`/`en`) and carry `title`, `prompt`, `hint`, `answers`, `storyReveal`, and optional `achievement`.
- **Canon rules:** `.agents/memory/eleven-eleven-lore.md` encodes the Fragment Law: every puzzle must reveal a story fragment; fragments are owned by a single entity; echo fragments unlock watcher/signal/architect paths. `MEMORY.md` points to lore.ts as the canonical story source of truth.
- **Surfaces:**
  - `src/features/puzzles/` — core puzzle engine and types.
  - `src/features/story-puzzles/` — story-gated puzzle sequence.
  - `src/features/puzzle-hub/` — puzzle browsing and selection.
  - `src/features/screens/PuzzleScreen.tsx` — primary puzzle gameplay screen with completion sound, reward receipt, and hint flow.
- **Reward sound:** `src/infrastructure/audio/puzzleRewardAudio.ts` exposes `playPuzzleCompletionSound(volume)` and `playAchievementUnlockSound(tier, volume)`. Volume is sourced from `useUiPreferencesStore.sfxVolume`.
- **Completion moment:** `PuzzleScreen.tsx` calls `playPuzzleCompletionSound(sfxVolume)` only after the authoritative receipt path succeeds. Never grant rewards or achievements from presentation code; never replay a server-owned reward from a duplicate request.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the actual puzzle data file, the target screen, and the relevant tests before changing behavior.
3. Preserve the Fragment Law: every new puzzle must include a `storyReveal` and an owning `entity`.
4. Preserve bilinguality: every new puzzle field that reaches the player must have both `ar` and `en` copies.
5. Preserve accessibility: completion must be visual + optional audio. Hint text must be readable. Focus must never be trapped.
6. Update tests alongside changes. `__tests__/corePlayerLoop.test.ts` and `milestoneOneExperience.test.ts` reference puzzle completion behavior.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Puzzle authoring checklist

- Entity: `echo` | `watcher` | `signal` | `architect`
- Dependencies respected: `watcher` and `signal` require `echo`; `architect` requires prior entities per canon.
- Answers are deterministic and unambiguous. One correct answer per puzzle unless the type is explicitly multi-answer.
- `storyReveal` is new content that advances canon, not a restatement of the prompt.
- `hint` is optional but must not contain the answer verbatim.
- No new puzzle type may break the existing 1000-puzzle target without a product directive.

## What is frozen and must not change

- Canon story endings, Memory Shards counts, and achievement registry.
- Cinematic scenes tied to puzzle completion.
- Server-owned reward authority or duplicate-request replay rules.
