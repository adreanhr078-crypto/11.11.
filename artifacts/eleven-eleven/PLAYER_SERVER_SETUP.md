# Player Server Setup

Phase 2 adds an authenticated player API and account-linked cloud saves.

The global leaderboard keeps Firebase Auth as the account authority and stores
server-owned Level/XP data in a private Cloudflare D1 binding. The browser never
receives write access to that database.

## Firebase

1. Open the Firebase project `eleveneleven-16435`.
2. Create a Firestore database if one does not exist yet.
3. Deploy the repository rules from this application directory:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

The rules allow a signed-in player to read and update only:

- `players/{theirUid}`
- `players/{theirUid}/saves/main`

## Cloudflare Pages

Configure these variables for the `eleven-eleven` Pages project:

```text
FIREBASE_PROJECT_ID=eleveneleven-16435
FIREBASE_WEB_API_KEY=<Firebase web API key>
PLAYER_ALLOWED_ORIGINS=https://your-game-domain.example,capacitor://localhost
```

The Firebase web API key identifies the project and is not a service-account
secret. Never add a Firebase service-account private key to the client or this
repository.

## Local development

Build once, then run the API and Vite in separate terminals:

```bash
npm run build
npm run dev:api
```

```bash
npm run dev
```

The local `.env` points the client to `http://127.0.0.1:8788/api/player`.
Server variables are read from the ignored `.dev.vars` file.

## Global Level, XP, and leaderboard

Create one D1 database and bind it to the Pages project with the exact variable
name `PLAYER_DB`:

```bash
npx wrangler d1 create eleven-eleven-player
```

Add the returned database binding to the Cloudflare Pages project, then apply
the tracked migration. Use `--local` for local development and `--remote` only
when the production database is ready:

```bash
npx wrangler d1 migrations apply eleven-eleven-player --local
npx wrangler d1 migrations apply eleven-eleven-player --remote
```

The first migration is `migrations/0001_player_progression.sql`. XP is derived
from the append-only `xp_reward_events` ledger. Each player/source reward key is
unique, and `player_progression.total_xp` is rebuilt from that ledger inside one
D1 batch. Do not expose `PLAYER_DB` to the Vite client.

## API routes

- `GET /api/player/bootstrap`: verifies the Firebase ID token, updates the
  player profile, and returns the current cloud save.
- `GET /api/player/save`: returns the authenticated player's save.
- `PUT /api/player/save`: writes a new atomic revision or returns `409` when
  another device changed the save first.
- `GET /api/player/leaderboard`: returns the top players and always includes the
  authenticated player's own global position.
- `POST /api/player/xp/claim`: validates a known server reward and grants it at
  most once. Client-provided XP amounts are rejected.
