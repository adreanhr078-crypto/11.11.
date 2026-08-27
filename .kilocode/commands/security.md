---description: Run a focused security audit on the 11.11 project (npm audit, secrets, Canon, OWASP, deps, accessibility).---
# /security — Security Audit

Run a focused security audit on the 11.11 project. This is a tighter, more actionable variant of `/audit` aimed at security: dependencies, secrets, Canon integrity, and player data exposure.

## Usage

`/security <target>` — where target is one of:

- (empty) — full security audit (deps + secrets + Canon + OWASP)
- `npm` — `npm audit --audit-level=moderate` (root + artifacts/eleven-eleven)
- `secrets` — scan for committed secrets, tokens, keys, private data
- `canon` — verify Canon/lore integrity (no contradictions, no edits to frozen lore)
- `owasp` — OWASP top 10 quick check (XSS, injection, broken auth, sensitive data, XXE, broken access control, misconfig, CSRF, insecure deserialization, vulnerable components)
- `deps` — unused or outdated dependencies
- `player-data` — verify no PII, tokens, or sensitive payloads in client code
- `firebase` — verify Firestore rules + auth flow
- `cloudflare` — verify wrangler bindings, secrets handling, DO auth

## Workflow

1. Run the selected security command sequence.
2. Capture exit code and first error line.
3. Report PASS / FAIL / UNVERIFIED with exact output.
4. If FAIL, list each finding with severity, file:line, and the recommended fix.
5. If UNVERIFIED, explain what evidence is unavailable.

## Full security audit sequence

```bash
# 1. Dependency vulnerabilities
npm audit --audit-level=moderate
cd artifacts/eleven-eleven && npm audit --audit-level=moderate && cd ../..

# 2. Secret scan
# Searches for common secret patterns in tracked files.
# Excludes: .git, node_modules, dist, build, .wrangler, .dev.vars (intentional)
grep -rEn --exclude-dir={node_modules,dist,build,.git,.wrangler,.tmp,tmp} \
  "(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{36}|firebase.*apiKey.*=.*['\"][A-Za-z0-9_-]{20,})" \
  artifacts/eleven-eleven/src artifacts/eleven-eleven/functions

# 3. Canon check — verify no recent edits to frozen lore
git diff --name-only HEAD~5 HEAD 2>/dev/null | \
  grep -E "(puzzles\.ts|lore\.ts|domain/cinematics/|content/puzzles/|smartLivePuzzleGenerator\.ts|_storyPuzzleDefinitions\.ts)" \
  || echo "OK: no frozen-path edits in last 5 commits"

# 4. Firestore rules (manual review)
ls -la artifacts/eleven-eleven/firestore.rules
cat artifacts/eleven-eleven/firestore.rules | head -50

# 5. Cloudflare wrangler secrets
grep -E "^\[|\.\.\." artifacts/eleven-eleven/wrangler.toml
grep -E "^\[|\.\.\." artifacts/eleven-eleven/workers/realtime/wrangler.jsonc

# 6. .env / .dev.vars presence
ls -la artifacts/eleven-eleven/.env artifacts/eleven-eleven/.dev.vars 2>/dev/null
ls -la .env .dev.vars 2>/dev/null
```

## OWASP quick check (manual)

| Risk | What to verify | Where to look |
|---|---|---|
| **A01 Broken Access Control** | Client never grants rewards; DO is the authority | `src/features/`, `workers/realtime/` |
| **A02 Cryptographic Failures** | No secrets in client; HTTPS only; tokens via secure cookies | `.env`, `wrangler.toml`, `firestore.rules` |
| **A03 Injection** | No raw SQL; Drizzle parameterized; Firestore rules reject injection | `migrations/`, `src/infrastructure/` |
| **A04 Insecure Design** | Bilingual + a11y + reduced-motion in product spec | `AGENT_RULES.md` |
| **A05 Security Misconfig** | Default-deny Firestore rules; no admin SDK on client | `firestore.rules` |
| **A06 Vulnerable Components** | `npm audit` clean; no unmaintained deps | `package.json` |
| **A07 Identification & Auth** | Firebase ID token verified server-side; never trust client UID | `functions/api/`, `workers/realtime/` |
| **A08 Software & Data Integrity** | Drizzle migrations forward-only; D1 migrations applied; no client-side generated code injected | `migrations/` |
| **A09 Logging & Monitoring** | No PII, tokens, or full payloads in logs; structured logging only | `src/infrastructure/`, `workers/realtime/` |
| **A10 SSRF** | Outbound HTTP from workers is restricted by wrangler config | `wrangler.jsonc` |

## Canon integrity check

The Canon (story fragments, Memory Shards, endings, achievements, cinematics) is frozen. The security audit verifies:

- No edits to `src/puzzles.ts`, `src/lore.ts`, `src/domain/cinematics/`, `src/content/puzzles/`, `_storyPuzzleDefinitions.ts`, `smartLivePuzzleGenerator.ts` in the current diff.
- No contradictions between fragments and their owning entity (`echo`, `watcher`, `signal`, `architect`).
- No contradicting achievement linkages.
- All bilingual (`ar` + `en`) coverage intact.

## Secrets scan patterns

The following patterns are flagged when committed to the repo (excluding `.env`, `.dev.vars`, `.gitignore`):

- AWS access keys: `AKIA[0-9A-Z]{16}`
- OpenAI keys: `sk-[A-Za-z0-9]{32,}`
- GitHub PATs: `ghp_[A-Za-z0-9]{36}`
- Firebase web API keys committed in source: detected via Firebase config files
- Generic high-entropy tokens in code: 32+ char base64 strings assigned to `token`, `secret`, `key`, `password` variables

## Player-data exposure

Verify:
- No PII (email, phone, name) is hard-coded in `src/`
- No real player IDs in fixtures or tests
- Firebase queries are owner-scoped
- Realtime DO auth verifies Firebase ID token
- Logs do not contain user data, tokens, or full payloads

## Decision

- **PASS** — no vulnerabilities at or above the chosen audit level; no secrets; no Canon violations.
- **FAIL** — one or more findings. Each must list severity, file:line, and recommended fix.
- **UNVERIFIED** — evidence unavailable (e.g., environment cannot run `npm audit`).

## Skills to load

- `$11.11-autonomous-quality-gate` — full quality gate
- `$11-11-cloudflare-workers` — wrangler secrets, D1, R2, DO auth
- `$11-11-mcp-integration` — MCP server audit
- `$11-11-kilo-config` — environment audit
