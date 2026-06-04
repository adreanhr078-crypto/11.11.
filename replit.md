# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **Story canon (source of truth):** `artifacts/eleven-eleven/src/lore.ts` — `CORE_LORE`, characters, time system, revelation arc, and the rule all future puzzles must follow.
- **Puzzles:** `artifacts/eleven-eleven/src/puzzles.ts` — puzzle definitions, entity intros, and per-puzzle `storyReveal` fragments (must stay consistent with `lore.ts`).
- **Achievements:** `artifacts/eleven-eleven/src/achievements.ts`
- **Puzzle UI:** `artifacts/eleven-eleven/src/PuzzleHub.tsx`; app shell + chat: `artifacts/eleven-eleven/src/App.tsx`.

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

"11.11" is a bilingual (Arabic/English) psychological-horror ARG web app. It is **puzzle-primary**: the player progresses through puzzles in the PuzzleHub, and each solved puzzle reveals a fragment of the core story.

- **Story (canon):** Echo is a child whose consciousness was trapped in the "11:11 System" after experiments by his father Kenja (The Architect). His mother Lina (The Lost Signal) was killed trying to save him. The player rebuilds Echo's shattered memory through puzzles.
- **Four entities** (Echo, Watcher, Lost Signal, Architect) are STORY CHARACTERS encountered via puzzle progression — not chat personalities.
- **Time system:** 11:11 PM = Synch Points (gate opens, every cycle begins here); 11:11PM–3:33AM = Phase Fracture Time (night/horror mode); 3:33 AM = full reset (loop restarts). Atmospheric horror — **no blood/gore**.
- **Echo-only chat** ("ECHO MIND"): no spam, only rare atmospheric daytime whispers.

The CANONICAL STORY lives in `artifacts/eleven-eleven/src/lore.ts` — it is the **source of truth**. Every new puzzle (`puzzles.ts`) must tie to this lore and reveal a NEW fragment (see `PUZZLE_CANON_RULE` in `lore.ts`).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
