---description: Write, edit, or refactor code in the 11.11 project with full quality gate.---
# /code — Write Code

Write or edit code following 11.11 project rules.

## Usage

/code <description of change>

## Mandatory Lifecycle

```
UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> SELF-CRITIQUE -> AUTO-FIX -> VERIFY AGAIN -> REGRESSION REVIEW -> FINAL DELIVERY
```

## Pre-flight

```bash
npm run agent:preflight
```

## Workflow

1. Understand: Restate the request and acceptance criteria.
2. Inspect: Read the existing code paths you'll touch.
3. Plan: Identify the smallest evidence-backed change.
4. Implement: Make only the planned changes.
5. Verify: Run `npm run typecheck && npm test && npm run build`.
6. Self-critique: What can still fail, race, or regress?
7. Auto-fix: Correct safe defects within scope.
8. Verify again: Re-run all checks after fixes.
9. Regression review: Confirm only intended files changed.
10. Final delivery: Report only what evidence supports.

## Constraints

- No modifications to: game logic, puzzles, Memory Shards, endings, achievements, cinematic scenes.
- Bilingual (ar/en) for all player-facing strings.
- Accessibility: ARIA, focus, reduced-motion, color-independent cues.
- Mute/volume respects `useUiPreferencesStore`.
- Reward authority remains server-only.

## Post-flight

```bash
npm run agent:postflight
```
