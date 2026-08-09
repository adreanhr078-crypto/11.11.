# Player Server Setup

Phase 2 adds an authenticated player API, account-linked cloud saves, and the
Profile + Level/XP foundation.

The global leaderboard keeps Firebase Auth as the account authority and stores
server-owned Level/XP, username reservations, verified Memory Fragment events,
and derived profile statistics in a private Cloudflare D1 binding. The browser
never receives write access to that database. Rank is always calculated from
the leaderboard; it is not stored in a profile.

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

`subjectId`, `createdAt`, and `uid` are immutable. Avatar values are fixed IDs
(`echo`, `silver_signal`, or `red_rift`); image uploads and external avatar URLs
are not supported.

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

Apply both tracked migrations. `0001_player_progression.sql` creates the XP
ledger; `0002_player_profile.sql` adds username reservations, the append-only
Memory Fragment ledger, derived profile stats, and append-only protection
triggers. XP and `Secrets Found` are derived only from verified server events.
Do not expose `PLAYER_DB` to the Vite client.

## API routes

- `GET /api/player/bootstrap`: verifies the Firebase ID token, updates the
  player profile (including a stable Subject ID), and returns the current cloud
  save.
- `GET /api/player/profile`: returns the authenticated profile, server-derived
  level/XP/rank, and verified stats.
- `PUT /api/player/profile`: changes only username, bio, or a fixed Avatar ID.
- `GET /api/player/save`: returns the authenticated player's save.
- `PUT /api/player/save`: writes a new atomic revision or returns `409` when
  another device changed the save first.
- `GET /api/player/leaderboard`: returns the top players and always includes the
  authenticated player's own global position.
- `POST /api/player/xp/claim`: validates a known server reward and grants it at
  most once. Client-provided XP amounts and Memory Fragment IDs are rejected;
  a fragment is extracted from the canonical server puzzle definition.
