# Echo Mind AI gateway

Echo Mind calls one private server endpoint: `/api/echo/chat`. API keys never
reach the browser or Android bundle. The gateway silently tries configured
open-weight/free-tier sources in this order:

1. Cloudflare Workers AI binding (`AI`)
2. Google Gemini Developer API free-tier models
3. OpenRouter Free Router
4. Groq open-weight models
5. Hugging Face Inference Providers
6. Existing OpenAI configuration, only when an OpenAI key is present

If a source is unavailable, rate-limited, times out, or returns an empty
answer, the gateway moves to the next source. Provider names and errors are
not returned to the player. Free tiers have quotas and are not unlimited.

## Recommended free setup

### 1. Cloudflare Workers AI (no API key in the app)

In Cloudflare Dashboard, open the Pages project and add a Workers AI binding
named exactly `AI` to the Pages Functions environment. Workers AI includes a
daily free allocation. The gateway rotates to another configured source after
that allocation is exhausted or a model is unavailable.

Pages Functions bindings must be added in the Cloudflare dashboard. Do not put
an account token in frontend variables.

### 2. Gemini Developer API

Add a Gemini key as a server secret. The default list rotates through the
current text models configured for this project:

```text
GEMINI_API_KEY=your_server_secret
GEMINI_MODELS=gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite
```

Multiple authorized project keys can be supplied through `GEMINI_API_KEYS`.
Free-tier quotas and model availability are controlled by Google and may
change, so keep the model list configurable in the deployment environment.

### 3. OpenRouter Free Router

Create a server key and add it as an encrypted Cloudflare Pages secret:

```text
OPENROUTER_API_KEY=your_server_secret
OPENROUTER_MODELS=openrouter/free
```

`openrouter/free` automatically selects from the free models currently
available on OpenRouter, so model availability can change without an app
release.

### 4. Optional extra fallbacks

```text
GROQ_API_KEY=your_server_secret
GROQ_MODELS=openai/gpt-oss-120b,openai/gpt-oss-20b

HF_TOKEN=your_server_secret
HF_MODELS=openai/gpt-oss-120b:fastest,Qwen/Qwen2.5-7B-Instruct-1M:fastest
```

You can supply comma-separated server keys through `OPENROUTER_API_KEYS`,
`GEMINI_API_KEYS`, `GROQ_API_KEYS`, `HF_TOKENS`, or `OPENAI_API_KEYS`. This is intended for keys
you are authorized to use, such as separate project or organization keys.

## Gateway controls

```text
ECHO_PROVIDER_ORDER=cloudflare,gemini,openrouter,groq,huggingface
ECHO_MAX_PROVIDER_ATTEMPTS=10
ECHO_PROVIDER_TIMEOUT_MS=12000
ECHO_PROVIDER_DEADLINE_MS=32000
ECHO_ALLOWED_ORIGINS=https://trusted-app.example,capacitor://localhost
```

Copy `.dev.vars.example` to `.dev.vars` for local Cloudflare Pages testing.
`.dev.vars` and `.env*` secrets are ignored by Git.

## Android builds

Set only the public gateway URL at build time:

```text
VITE_ECHO_AI_ENDPOINT=https://game-api.example.com/api/echo/chat
```

Never use a `VITE_` prefix for an AI provider key because Vite embeds those
values into the client bundle.

## Narrative boundary

The client sends only knowledge already unlocked in the canonical game state:
memory fragments, restored page descriptions/transcripts, solved-puzzle story
beats, prior decisions, completed scenes, and Echo's current personality.
Locked memories, future endings, active internal flags, and puzzle solutions
are excluded. The gateway sanitizes this projection again and instructs every
provider to reveal at most one small connection per reply.
