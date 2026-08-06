# Player Server Setup

Phase 2 adds an authenticated player API and account-linked cloud saves.

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

## API routes

- `GET /api/player/bootstrap`: verifies the Firebase ID token, updates the
  player profile, and returns the current cloud save.
- `GET /api/player/save`: returns the authenticated player's save.
- `PUT /api/player/save`: writes a new atomic revision or returns `409` when
  another device changed the save first.
