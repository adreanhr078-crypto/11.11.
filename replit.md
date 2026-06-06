# 11:11 - The System Awakens

A bilingual (Arabic/English) psychological-horror ARG web app where the player rebuilds the shattered memory of a trapped consciousness through puzzle progression.

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
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- **Story canon (source of truth):** `artifacts/eleven-eleven/src/lore.ts` — `CORE_LORE`, characters, time system, revelation arc, and the rule all future puzzles must follow.
- **Puzzles:** `artifacts/eleven-eleven/src/puzzles.ts` — puzzle definitions, entity intros, and per-puzzle `storyReveal` fragments (must stay consistent with `lore.ts`).
- **Achievements:** `artifacts/eleven-eleven/src/achievements.ts`
- **Puzzle UI:** `artifacts/eleven-eleven/src/PuzzleHub.tsx`; app shell + chat: `artifacts/eleven-eleven/src/App.tsx`.

## Architecture decisions

- **Zod** used for schema definitions across lib/db via `drizzle-zod` for consistent insert/select type generation.
- **Puzzle-primary design:** The ARG story is driven entirely by puzzle progression. The four entities (Echo, Watcher, Lost Signal, Architect) are story characters encountered through puzzles — NOT chat personalities. Only Echo has a chat route.
- **Cross-device identity via anonymous fingerprint:** Users are identified by server-issued UUIDv4. Cross-device restore uses browser fingerprint matching (non-PII). No login required.
- **esbuild CJS bundle for API server** — faster startup and simpler deployment than ts-node in production.
- **pnpm catalog** centralizes shared dependency versions (React, Vite, Tailwind, etc.) across all workspace packages.

## Product

"11.11" is a bilingual (Arabic/English) psychological-horror ARG web app. It is **puzzle-primary**: the player progresses through puzzles in the PuzzleHub, and each solved puzzle reveals a fragment of the core story.

- **Story (canon):** Echo is a child whose consciousness was trapped in the "11:11 System" after experiments by his father Kenja (The Architect). His mother Lina (The Lost Signal) was killed trying to save him. The player rebuilds Echo's shattered memory through puzzles.
- **Four entities** (Echo, Watcher, Lost Signal, Architect) are STORY CHARACTERS encountered via puzzle progression — not chat personalities.
- **Time system:** 11:11 PM = Synch Points (gate opens, every cycle begins here); 11:11PM–3:33AM = Phase Fracture Time (night/horror mode); 3:33 AM = full reset (loop restarts). Atmospheric horror — **no blood/gore**.
- **Echo-only chat** ("ECHO MIND"): no spam, only rare atmospheric daytime whispers.

The CANONICAL STORY lives in `artifacts/eleven-eleven/src/lore.ts` — it is the **source of truth**. Every new puzzle (`puzzles.ts`) must tie to this lore and reveal a NEW fragment (see `PUZZLE_CANON_RULE` in `lore.ts`).

## User preferences

- Bilingual design (Arabic/English) — entire story canon, puzzles, achievements, and UI must support both languages.
- Atmospheric horror only — **no blood, no gore, no explicit violence**. Fear is psychological.
- Echo-only chat — the "ECHO MIND" chat assistant is the sole conversational entity. No spam, only rare atmospheric whispers.
- Story is puzzle-gated: the FRAGMENT_LAW (lore.ts) enforces that no user ever sees the full story at once.

## Gotchas

- Always run `pnpm run typecheck` before committing — the workspace has strict TypeScript settings across all packages.
- `DATABASE_URL` must be set before starting the API server. Use `pnpm --filter @workspace/db run push` to sync schema changes.
- The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth for generated API clients and Zod schemas. Run `pnpm --filter @workspace/api-spec run codegen` after any spec changes.
- `ai-chat.ts` uses the model `gpt-4o` — verify this model is available through your OpenAI integration base URL.
- push-subscriptions.ts schedule mask: bit2 (3:33) is always forced ON by the server. Users cannot silence the 3:33 notification.
- The `src/App.jsx` at workspace root is a placeholder entry point. The main apps live under `artifacts/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
