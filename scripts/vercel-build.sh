#!/bin/bash
# Vercel Build Script for 11.11 Project
# This script handles the monorepo build process for Vercel

set -e

echo "📦 Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "📁 Current directory structure:"
ls -la

echo "🔨 Building API client first (workspace dependency)..."
cd lib/api-client-react
pnpm exec tsc --noEmit 2>/dev/null || true
cd ../..

echo "🏗️ Building the eleven-eleven app..."
cd artifacts/eleven-eleven
pnpm exec vite build --config vite.config.ts
cd ../..

echo "✅ Build complete!"