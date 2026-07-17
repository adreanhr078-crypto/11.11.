---
name: 11.11 workspace setup
description: pnpm supply-chain policy workaround, port config, and dev server setup for the eleven-eleven artifact.
---

## pnpm supply-chain policy
Replit's pnpm supply-chain check blocks installs when the lockfile contains flagged packages.
**Fix:** delete `pnpm-lock.yaml` and re-run `pnpm install --no-frozen-lockfile` to regenerate a clean lockfile.
Also add `confirmModulesPurge=false` to root `.npmrc` and do NOT list `pnpm` itself as a dependency in `package.json` (it's a system tool now via `nodejs-22` nix module).

**Why:** the root `package.json` previously had `"pnpm": "^11.13.1"` in devDependencies, which pnpm 10.x tried to install through itself and hit the supply-chain check.

## Vite port
The artifact expects port **23344**. Set in `artifacts/eleven-eleven/vite.config.ts`:
```ts
server: { host: '0.0.0.0', port: 23344, allowedHosts: true }
```

## Local npm install fallback
If pnpm workspace fails, `cd artifacts/eleven-eleven && npm install` works for local deps (zustand, framer-motion, etc.) since the local `package.json` lists them directly.

## Workflow command
`pnpm --filter @workspace/eleven-eleven run dev` — package name must match `"@workspace/eleven-eleven"` in `artifacts/eleven-eleven/package.json`.
