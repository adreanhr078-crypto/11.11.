---description: Audit the 11.11 project for security, dependencies, and canon compliance.---
# /audit — Project Audit

Audit the 11.11 project for security, dependencies, and canon compliance.

## Usage

/audit <target> — where target is one of:
- `npm` — `npm audit --audit-level=moderate`
- `secrets` — scan for committed secrets/keys
- `canon` — verify story canon consistency
- `accessibility` — WCAG 2.2 AA review
- `performance` — bundle size, LCP, INP
- `dependencies` — unused or outdated packages

## Common audit commands

```bash
# Security audit
npm audit --audit-level=moderate
cd artifacts/eleven-eleven
npm audit --audit-level=moderate

# Project doctor
npm run doctor
npm run doctor:counts
npm run doctor:white-screen
npm run doctor:storage
npm run doctor:files
npm run doctor:build

# TypeScript strict
npm run typecheck

# Bundle size
ls -lah dist/assets/
```

## Canon audit checklist

- [ ] Story fragments tied to owning entity
- [ ] Echo character consistency
- [ ] No contradicting canon facts
- [ ] Achievement linkages correct
- [ ] Bilingual (ar/en) for all player-facing strings

## Accessibility audit checklist

- [ ] ARIA roles on interactive elements
- [ ] Visible focus states
- [ ] Color-independent state cues
- [ ] Touch targets >= 44px
- [ ] Reduced-motion alternatives
- [ ] RTL/LTR support
- [ ] Keyboard navigation
- [ ] Screen reader tested

## Skills to load

- `$11.11-autonomous-quality-gate` — full quality gate
- `$11-11-ui` — UI quality
- `$11-11-mcp-integration` — MCP servers audit
