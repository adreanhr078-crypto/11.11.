# Echo Mind AI gateway

Echo Mind never sends an OpenAI API key from the game client. The client calls
the Cloudflare Pages Function at `/api/echo/chat`, or the absolute endpoint set
in `VITE_ECHO_AI_ENDPOINT` for the Android build.

## Server variables

- `OPENAI_API_KEY`: required secret. Configure it only in the hosting provider.
- `ECHO_AI_MODEL`: optional. Defaults to `gpt-5.6`.
- `ECHO_ALLOWED_ORIGINS`: optional comma-separated origins for external Android
  or preview clients. Same-origin requests are accepted automatically.

## Android builds

Set `VITE_ECHO_AI_ENDPOINT` at build time to the deployed HTTPS function URL,
for example:

```text
VITE_ECHO_AI_ENDPOINT=https://game-api.example.com/api/echo/chat
```

The Android manifest includes microphone permission. The game requests access
only when the player presses the voice conversation button.

## Narrative boundary

The gateway receives a projection of unlocked memories, unlocked fragments,
completed scenes, solved puzzle IDs, prior decisions, and Echo personality.
Locked content, ending eligibility, active internal flags, and puzzle answers
are deliberately excluded.
