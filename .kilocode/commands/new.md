---
description: Create a new file, component, or feature in the 11.11 project
---

# /new — Create New Code

Create new code in the 11.11 project following established conventions.

## Usage

`/new <type> <name>` — where type is one of:
- `component` — React component
- `screen` — Full screen
- `feature` — New feature module
- `store` — Zustand store
- `api` — API endpoint
- `test` — Test file
- `doc` — Markdown documentation

## Rules

1. Pre-flight: Run `npm run agent:preflight` first.
2. No modifications to frozen systems.
3. TypeScript strict, no `any`, named exports.
4. Bilingual (ar/en) for player-facing text.
5. Accessibility: ARIA, focus, reduced-motion.
6. Post-flight: Run `npm run agent:postflight` after creation.
