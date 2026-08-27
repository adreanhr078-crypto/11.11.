---
name: 11-11-cloudflare-workers
description: Author, deploy, and debug the 11.11 Cloudflare Workers surface: realtime Durable Object rooms (chess), Pages Functions, D1 SQL, R2 storage, KV namespaces, Queues, Workers AI, and Wrangler-driven local dev. Use for any change to `workers/realtime/`, `wrangler.toml`, `wrangler.jsonc`, `functions/api/`, D1 migrations, R2 buckets, or KV bindings. Enforces the read-only `cloudflare-docs-mcp` and `cloudflare-bindings-mcp` MCP servers for safe lookup during development. Do not modify frozen game logic, puzzle canon, or other locked systems unless the task explicitly scopes to worker-only changes.
---

# 11.11 Cloudflare Workers

11.11 runs its realtime, multiplayer, and server-authoritative surfaces on Cloudflare Workers. This skill covers the patterns, the local-dev workflow, and the production deploy rules. Read it before touching any file under `workers/`, `functions/`, or `wrangler*.{toml,jsonc}`.

## Active implementation facts

- **CLI:** `wrangler@^4.120.1` is the dev and deploy tool. Local dev runs `wrangler dev` for the realtime worker and `wrangler pages dev public` for Pages Functions.
- **Realtime worker config:** `workers/realtime/wrangler.jsonc` declares the Durable Object bindings, D1, R2, KV, and Queue bindings. The `chess_casual` and `chess_ranked_blitz` modes live here.
- **Pages Functions:** `functions/api/` contains the request handlers served by Cloudflare Pages. Each file maps to an HTTP route.
- **D1:** SQL database. Migrations live under `migrations/`. The schema is the source of truth; Drizzle ORM (`drizzle-orm@^0.45.2`, `drizzle-zod@^0.8.3`) wraps the SQL access.
- **R2:** Object storage for large assets and archival. Bindings are declared in `wrangler.jsonc`.
- **KV:** Key-value store for configuration and read-mostly data.
- **Workers AI:** Optional, opt-in. Bind via `wrangler.jsonc` and access via the `env.AI` binding.
- **Type generation:** `wrangler types` regenerates `worker-configuration.d.ts`. CI runs `npm run types:realtime` to keep types in sync.
- **Local DB:** Local D1 is backed by `.wrangler/state/v3/d1` in the workspace; reset with `wrangler d1 reset --local`.
- **MCP servers:** `cloudflare-docs-mcp` (official docs lookup) and `cloudflare-bindings-mcp` (read-only runtime inspection) are enabled in `.kilo/kilo.json` via the `mcp-remote` proxy.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `wrangler.jsonc` and the existing worker entry points before changing behavior.
3. For schema changes, write a new D1 migration under `migrations/` and apply it locally first.
4. For Durable Object changes, document the new state shape and migration strategy.
5. Update types: `npm run types:realtime`.
6. Run `npm run typecheck` and `npm run typecheck:realtime`.
7. Run `npm run test:realtime` (vitest with the workers pool).
8. Run `npm run check:realtime` (types + typecheck + `wrangler deploy --dry-run`).
9. Run `npm run agent:postflight`. If it fails, do not declare success.

## Local development

```bash
# Realtime worker
cd artifacts/eleven-eleven
wrangler dev --config workers/realtime/wrangler.jsonc --port 8790

# Pages Functions (web)
wrangler pages dev public --port 8788

# Local D1 inspection
wrangler d1 execute <DB_NAME> --local --command "SELECT * FROM users LIMIT 10"
```

The dev-full-stack script in `artifacts/eleven-eleven/tools/dev-full-stack.mjs` brings all of these up together.

## D1 migrations

- One file per migration: `migrations/0001_init.sql`, `migrations/0002_add_chess_ratings.sql`, etc.
- Every migration is forward-only. No edits to applied migrations.
- Each migration is idempotent at the SQL level where possible (use `IF NOT EXISTS`).
- Apply locally with `wrangler d1 migrations apply <DB_NAME> --local`.
- Apply to production with `wrangler d1 migrations apply <DB_NAME> --remote`. Production apply must be reviewed.
- Drizzle schema lives alongside the application code; regenerate with `drizzle-kit generate` after a schema change.

## Durable Objects (realtime chess)

- One Durable Object class per room type (`ChessCasualRoom`, `ChessRankedBlitzRoom`).
- State is a small, serializable struct. Avoid storing large objects or sockets directly.
- Use `blockConcurrencyWhile` for critical initialization (read once, write once).
- Use `alarm()` for periodic work (stale sweep, lease reconciliation).
- WebSocket hibernation: rely on `state.acceptWebSocket()` and `webSocketMessage()` for chess moves. Do not hold raw sockets outside the DO.
- Reward authority: the DO is the source of truth. Frontend receives the receipt, never the authority. No rewards from client state.
- Authoritative state format: FEN for chess. Frontend renders from FEN, never from client-computed state.

## R2 storage

- One bucket per logical surface (e.g., `cinematics`, `user-uploads`, `audio-cache`).
- Filenames are versioned and stable: `<surface>/<name>__v<MAJOR.MINOR>.<ext>`.
- Access from the worker via the binding: `env.R2_BUCKET.get(key)`.
- Use signed URLs for private content. Never expose bucket keys to the client.
- Set `Cache-Control` explicitly on every put.

## KV

- One namespace per logical surface.
- Keys are namespaced: `<surface>:<id>`.
- Reads are eventually consistent. Do not use KV for any flow that requires read-after-write.
- Writes are eventually consistent too. Do not use KV as a rate limiter without a guard.

## Pages Functions

- One file per route under `functions/api/`. File name = path: `functions/api/player/me.ts` → `GET /api/player/me`.
- Use `fetch` signature handlers. Return `Response.json(...)` for JSON, `new Response(...)` for streams.
- Validate request bodies with Zod; never trust the client.
- Auth via Firebase ID token: `Authorization: Bearer <token>`. Verify on the server.
- All rewardable endpoints must require time, active participation, and real play. Fast or abandoned calls are logged but not rewarded.

## Secrets and environment

- Secrets go in `wrangler secret put NAME` (production) or `.dev.vars` (local). Never in code.
- The realtime worker test config reads from `.dev.vars.example` for the test environment.
- Rotate tokens only via Wrangler; do not paste tokens into chat or commits.
- Audit `.dev.vars` and `.env*` for committed secrets on every change.

## Tests (vitest with workers pool)

- Test files live next to the worker: `workers/realtime/test/realtimeWorker.test.ts`.
- The Vitest config uses `@cloudflare/vitest-pool-workers` to run tests in the Workers runtime.
- Use `SELF.fetch(...)` to drive end-to-end flows without spinning up the dev server.
- For Durable Object tests, use `env.<BINDING>.idFromName('test-room')` then `env.<BINDING>.get(id)`.
- For D1 tests, apply migrations to the per-test D1 instance and seed fixtures explicitly.
- For R2 tests, use a per-test bucket; do not share state across tests.

## Deploy

- `npm run check:realtime` must pass before any deploy.
- Production deploy uses `wrangler deploy --config workers/realtime/wrangler.jsonc` for the worker and `wrangler pages deploy artifacts/eleven-eleven/dist` for the static bundle.
- D1 migrations to production are a separate, reviewed step.
- Rollback: keep the previous deploy URL in `wrangler.jsonc`; use `wrangler rollback` to revert.

## MCP-driven lookup (read-only)

Use the local MCP servers for safe, ad-hoc lookups during development:

- `cloudflare-docs-mcp`: ask for the API reference, schema examples, or best practice for Workers, D1, R2, Durable Objects, Pages, or Wrangler.
- `cloudflare-bindings-mcp`: list local D1 databases, inspect schema, list R2 buckets, list Durable Object namespaces, list KV namespaces. Read-only. No deploy, no write, no secrets.

The MCP servers are scoped to read-only by design (see `.kilo/kilo.json` `_meta.explicitly_denied`). They will refuse write operations.

## Anti-patterns to refuse

- Reading from a mutable external source inside a Durable Object on the request path (causes latency).
- Storing the WebSocket reference in DO state (use `state.getWebSockets()` or `state.acceptWebSocket()`).
- Granting rewards in the frontend. The worker is the authority.
- Committing a `.dev.vars` value with a real secret.
- Editing an applied D1 migration. Always add a new one.
- Using `eval` or any dynamic code execution in a worker.
- Trusting client-supplied IDs without verification.
- Returning secrets, tokens, or PII from any endpoint.
- Mounting a global `setInterval` inside a Durable Object (use `alarm()`).

## What is frozen and must not change

- The frozen-source list at `artifacts/eleven-eleven/AGENT_RULES.md` section 6.
- Reward authority and receipt replay rules.
- The canonical FEN state format for chess (frontend renders, server owns).
- The chess matchmaker name pattern (`me:chess_casual:default:open`, `me:chess_ranked_blitz:default:open`).
