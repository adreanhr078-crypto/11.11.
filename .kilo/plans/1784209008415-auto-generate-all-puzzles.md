# Auto-Generate All Puzzles Plan

## Problem
Original 219 puzzles use only 3 repetitive templates per entity (`i % 3`). Arc puzzles 220-1000 are auto-generated with unique story-driven content. Request: rebuild ALL 1-1000 puzzles to be automatically generated, each revealing story in sequence.

## Goal
Replace the template-based generation for puzzles 1-219 with an auto-generated system that matches the quality and story-driven nature of puzzles 220-1000, while preserving:
- `ORIGINAL_PUZZLE_COUNT = 219`
- `TOTAL_PUZZLES = 1000`
- Entity distribution `[55, 55, 55, 54]`
- All puzzle IDs (`echo_1`..`echo_55`, `watcher_1`..`watcher_55`, `signal_1`..`signal_55`, `architect_1`..`architect_54`)
- All public APIs, gameplay logic, progression, save data, narrative behavior

## Approach
Only modify `src/stores/gameStoreHelpers.ts:generateAllPuzzles()`. Replace the hardcoded `templates` + `i % 3` loop for the first 219 puzzles with a deterministic auto-generator that produces unique content per puzzle index while keeping the same shape and IDs.

### Story structure for 1-219
Divide each entity's puzzle range into 4 narrative phases:
- Phase 1 (puzzles 1-~14): Awakening — first contact, confusion, curiosity
- Phase 2 (puzzles ~15-~28): Discovery — deeper understanding, secrets emerge
- Phase 3 (puzzles ~29-~42): Conflict — tension, corruption, resistance
- Phase 4 (puzzles ~43 to end): Revelation — truth, choice, transformation

Themes, emotional tones, and story fragments will evolve deterministically by puzzle index so the narrative feels continuous and ordered.

### Content rules
- Questions: generated from entity-specific vocabulary + phase-specific sentence structures
- Answers: 3 options, 1 correct; format varies by phase
- Hints: phase-appropriate guidance
- Story reveals: short fragment that advances the entity's arc
- Effects: balanced per phase, scaled slightly by puzzle index
- Difficulty: starts low (1-3) and gradually increases to 8-10 by puzzle 219

### Non-goals
- Do not change arc puzzle generators (220-1000)
- Do not change `PuzzleNode` type or store shape
- Do not add `as any` or disable TS checks
- Do not change achievement/ending logic that depends on puzzle counts

## Validation
- Total puzzles = 219 + 781 = 1000
- All original puzzle IDs preserved
- No duplicate IDs
- Each puzzle has non-empty question/answers/hint/storyReveal
- Arc puzzle counts unchanged
