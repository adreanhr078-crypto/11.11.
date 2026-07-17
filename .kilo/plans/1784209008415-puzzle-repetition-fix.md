# Puzzle Repetition Fix Plan

## Problem
Original 219 puzzles in `gameStoreHelpers.ts:generateAllPuzzles()` are generated from only **3 templates per entity** using `i % 3`. This causes severe repetition:
- 55 echo puzzles → only 3 unique patterns
- 55 watcher puzzles → only 3 unique patterns
- 55 signal puzzles → only 3 unique patterns
- 54 architect puzzles → only 3 unique patterns

Player experience: puzzles feel identical after the first 3 per entity.

## Goal
Increase puzzle variety while preserving:
- All existing public APIs
- Puzzle counts (`ORIGINAL_PUZZLE_COUNT = 219`, `TOTAL_PUZZLES = 1000`)
- Entity distribution `[55, 55, 55, 54]`
- Arc puzzle counts and ranges
- Gameplay logic, progression, save data, narrative behavior

## Proposed Change
Expand the template arrays in `gameStoreHelpers.ts:generateAllPuzzles()` from **3 to 12 unique patterns per entity**, using deterministic selection `i % 12` instead of `i % 3`.

### Scope
- **Only** modify `src/stores/gameStoreHelpers.ts`
- **Only** modify the `templates` object inside `generateAllPuzzles()`
- No changes to any other file

### Validation
- Puzzle count remains 219
- Arc puzzle counts unchanged
- All puzzle IDs remain unique and sequential
- No store/type/API changes
