---description: Work on puzzle features in the 11.11 project.---
# /puzzle — Puzzle Tasks

Work on puzzle features: story puzzles, daily/weekly puzzles, fragment law.

## Usage

/puzzle <task> — where task is one of:
- `story` — work on a story puzzle
- `daily` — daily puzzle generation
- `weekly` — weekly puzzle generation
- `new` — author a new puzzle
- `review` — review a puzzle
- `test` — run puzzle tests

## Active files

- `src/puzzles.ts` — 20 story puzzles (14 main + 6 secret)
- `src/content/puzzles/storyPuzzleCatalog.ts` — story puzzle catalog
- `src/features/puzzles/` — puzzle engine
- `src/features/story-puzzles/` — story-gated puzzles
- `src/features/puzzle-hub/` — puzzle browsing
- `src/features/screens/PuzzleScreen.tsx` — main puzzle screen
- `src/domain/live-challenges/smartLivePuzzleGenerator.ts` — 15 patterns generator

## Puzzle types (15 patterns)

1. Memory fragment
2. Wire routing
3. Cipher
4. Sequence
5. Matrix
6. Timeline
7. Pattern scan
8. Clue match
9. Routing
10. Load balance
11. Logical ordering
12. Text puzzle
13. Symbolic pairs
14. Spatial rotation
15. Word path

## Entity ownership

- `echo` — first voice, no requires
- `watcher` — requires echo
- `signal` — requires echo
- `architect` — requires prior entities

## Rules (Fragment Law)

1. Every puzzle must reveal a `storyReveal`.
2. Every puzzle must have an owning `entity`.
3. Every player-facing field must be bilingual (ar/en).
4. Completion must be accessible (visual + optional audio).
5. Server is reward authority; never grant rewards from UI.

## Skills to load

- `$11-11-puzzles` — puzzle authoring, fragment law
- `$11-11-ui` — puzzle screen UI
- `$11-11-audio` — completion sound
