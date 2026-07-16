#!/bin/bash
set -e
# Install dependencies after any task merge
pnpm install --frozen-lockfile
# NOTE: DB schema migrations are intentionally NOT run here.
# drizzle-kit push is interactive and can cause data loss if run automatically.
# Apply schema changes manually: pnpm --filter @workspace/db run push
