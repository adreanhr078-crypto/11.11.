---description: Run tests for the 11.11 project and report results.---
# /test — Run Tests

Run the project's test suite and report pass/fail.

## Usage

/test [scope] — where scope is one of:
- (empty) — run all unit tests: `npm test`
- `realtime` — `npm run test:realtime`
- `content` — `npm run validate:content`
- `media` — `npm run media:validate`
- `env` — `npm run env:check`
- `audit` — `npm audit --audit-level=moderate`

## Workflow

1. Run the selected test command.
2. Report PASS / FAIL / UNVERIFIED with exact output.
3. If FAIL, list failed assertions and the responsible file/line.
4. If UNVERIFIED, explain what runtime evidence is missing.

## Post-flight

```bash
npm run agent:postflight
```

## Test commands reference

| Command | Purpose |
|---|---|
| `npm test` | Unit tests (tsx --test) |
| `npm run test:realtime` | Realtime worker tests (vitest) |
| `npm run typecheck` | TypeScript type check |
| `npm run typecheck:realtime` | Realtime worker type check |
| `npm run build` | Vite production build |
| `npm run validate:content` | Content registry validation |
| `npm run media:validate` | Media asset validation |
| `npm run env:check` | Free media tools availability check |
| `npm run doctor` | Project doctor (counts, white-screen, storage, files, build) |
| `npm run agent:preflight` | Pre-edit gate |
| `npm run agent:postflight` | Post-edit gate |
