---description: Run the full 11.11 autonomous quality gate.---
# /quality-gate — Quality Gate

Run the full 11.11 autonomous quality gate workflow.

## Usage

/quality-gate [scope] — where scope is one of:
- (empty) — full gate
- `preflight` — pre-edit gate only
- `postflight` — post-edit gate only
- `code` — code-only checks (typecheck, test, build)
- `content` — content validation
- `media` — media validation
- `env` — environment check
- `audit` — npm audit

## Full gate sequence

```bash
cd artifacts/eleven-eleven
npm run agent:preflight
npm run validate:content
npm run typecheck
npm run typecheck:realtime
npm test
npm run test:realtime
npm run build
npx wrangler deploy --dry-run --config workers/realtime/wrangler.jsonc
npm audit --audit-level=moderate
npm run agent:postflight

cd ../..
npm audit --audit-level=moderate
npm run media:validate
npm run env:check
```

## Quality gate decision

- PASS — requested behavior implemented, all applicable checks pass, no fixable defects remain.
- FAIL — required check fails or known fixable defect remains.
- UNVERIFIED — missing runtime/external evidence.
- BLOCKED — external blocker prevents completion.

## Lifecycle

```
UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> SELF-CRITIQUE ->
AUTO-FIX SAFE DEFECTS -> VERIFY AGAIN -> REGRESSION REVIEW -> FINAL DELIVERY
```

## Skills to load

- `$11.11-autonomous-quality-gate` — full quality gate workflow
- `$11.11-player-experience-loop` — player journey verification
