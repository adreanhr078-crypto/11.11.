# Wave 2 — Skills Upgrade Report
**Date:** 2026-08-26
**Scope:** Add the five critical new skills identified in the Wave 0 audit
**Status:** ✅ COMPLETE

---

## Executive Summary

Wave 2 added **5 new skills** to the 11.11 project, with full canonical content in `.agents/skills/` and mirror pointers in `.kilo/skills/`. No existing skills were modified. No game code, puzzles, lore, endings, achievements, or production assets were touched.

---

## Files Created (12 files)

### Canonical Skills (5 in `.agents/skills/`)

| # | Path | Size (approx lines) | Purpose |
|---|---|---|---|
| 1 | `.agents/skills/11-11-react-patterns/SKILL.md` | ~140 | React 19 + TypeScript + Zustand + RHF + Radix + Framer Motion patterns |
| 2 | `.agents/skills/11-11-three-r3f/SKILL.md` | ~150 | Three.js + React Three Fiber + Drei patterns |
| 3 | `.agents/skills/11-11-playwright/SKILL.md` | ~145 | E2E browser testing with Playwright + white-screen guard |
| 4 | `.agents/skills/11-11-accessibility-testing/SKILL.md` | ~150 | WCAG 2.2 AA + bilingual RTL/LTR + reduced-motion |
| 5 | `.agents/skills/11-11-cloudflare-workers/SKILL.md` | ~155 | Workers + D1 + R2 + Durable Objects + Wrangler |

### Mirror Skills (5 in `.kilo/skills/`)

| # | Path | Purpose |
|---|---|---|
| 6 | `.kilo/skills/11-11-react-patterns/SKILL.md` | Mirror pointer to canonical |
| 7 | `.kilo/skills/11-11-three-r3f/SKILL.md` | Mirror pointer to canonical |
| 8 | `.kilo/skills/11-11-playwright/SKILL.md` | Mirror pointer to canonical |
| 9 | `.kilo/skills/11-11-accessibility-testing/SKILL.md` | Mirror pointer to canonical |
| 10 | `.kilo/skills/11-11-cloudflare-workers/SKILL.md` | Mirror pointer to canonical |

### Documentation Update (1)

| # | Path | Purpose |
|---|---|---|
| 11 | `.kilocode/commands/help.md` | Added 5 new skills to the skill listing |
| 12 | `.kilo/reports/wave2-skills-report.md` | This report |

---

## Skill Coverage Matrix

| Domain | Skill | Status |
|---|---|---|
| **Frontend — React** | 11-11-react-patterns | ✅ NEW (Wave 2) |
| **Frontend — 3D** | 11-11-three-r3f | ✅ NEW (Wave 2) |
| **Testing — E2E** | 11-11-playwright | ✅ NEW (Wave 2) |
| **Testing — A11y** | 11-11-accessibility-testing | ✅ NEW (Wave 2) |
| **Cloud — Cloudflare** | 11-11-cloudflare-workers | ✅ NEW (Wave 2) |
| **Game — Chess** | 11-11-chess | ✅ Existed |
| **Game — Puzzles** | 11-11-puzzles | ✅ Existed |
| **Game — Audio** | 11-11-audio | ✅ Existed |
| **Game — UI** | 11-11-ui | ✅ Existed |
| **Quality — Gate** | 11.11-autonomous-quality-gate | ✅ Existed |
| **Quality — Player Experience** | 11.11-player-experience-loop | ✅ Existed |
| **Media — Cinematic** | 11-11-cinematic-assets | ✅ Existed |
| **Media — Image** | 11-11-image-generation | ✅ Existed |
| **Media — 3D Pipeline** | 11-11-3d-pipeline | ✅ Existed |
| **Media — Tools** | 11-11-free-media-tools | ✅ Existed |
| **Media — Blender** | 11-11-blender / 11-11-blender-cli | ✅ Existed |
| **Media — Audio** | 11-11-ffmpeg / 11-11-audacity / 11-11-imagemagick | ✅ Existed |
| **Media — AI** | 11-11-stable-diffusion / 11-11-comfyui / 11-11-canva / 11-11-canva-cli / 11-11-ai-audio / 11-11-tts | ✅ Existed |
| **Tooling — Kilo** | 11-11-kilo-config / 11-11-mcp-integration | ✅ Existed |

---

## Skill Count

| Path | Count before | Count after | Change |
|---|---|---|---|
| `.agents/skills/*/SKILL.md` | 25 | 30 | +5 |
| `.kilo/skills/*/SKILL.md` | 25 | 30 | +5 |
| **Total** | **50** | **60** | **+10** |

---

## Skill Design Principles (applied to all 5 new skills)

Each new skill follows the established 11.11 skill template:

1. **Frontmatter** with `name` and a single-sentence `description` that states when to use the skill and what it must not touch.
2. **Active implementation facts** — concrete file paths, dependency versions, current state, recent decisions.
3. **Required workflow** — preflight, the action sequence, and postflight.
4. **Domain rules** — patterns, anti-patterns, and non-negotiable contracts.
5. **What is frozen and must not change** — explicit pointer to `AGENT_RULES.md` section 6 plus any domain-specific frozen surfaces.
6. **No new commands** — each skill is a reference document, not a runnable command.
7. **Bilingual awareness** — every skill that touches player-facing surfaces calls out the Arabic/English requirement.

---

## Skill-by-Skill Highlights

### 1. 11-11-react-patterns
- **Stack pinned:** React 19.2, TypeScript 5.9 strict, wouter 3.3, Zustand 5, RHF 7, Zod 3, Radix, Framer Motion 12, TanStack Query 5, Tailwind 4.
- **Patterns covered:** component rules, hook rules, state layering (local/Zustand/React Query), routing, forms, animation, a11y, performance, anti-patterns.
- **Connects to:** `11-11-ui`, `11-11-accessibility-testing`, `11-11-playwright`.

### 2. 11-11-three-r3f
- **Stack pinned:** three 0.185, R3F 9.6, drei 10.7.
- **Patterns covered:** scene composition, loading + suspense, asset rules (Draco/Meshopt/KTX2), performance, camera, lighting, accessibility for 3D, integration, error/failure modes.
- **Budget:** < 5MB GLB, < 50k triangles, < 4 materials per mesh.
- **Connects to:** `11-11-3d-pipeline`, `11-11-blender`, `11-11-cinematic-assets`, `11-11-ui`.

### 3. 11-11-playwright
- **Stack pinned:** Playwright 1.62 + MCP.
- **Includes:** white-screen guard spec template, console-error capture, screenshot diffs, viewport matrix (mobile/tablet/desktop × LTR/RTL), bilingual coverage, reduced-motion, auth/data setup, debugging, anti-patterns.
- **Connects to:** `11-11-react-patterns`, `11-11-accessibility-testing`.

### 4. 11-11-accessibility-testing
- **Standard:** WCAG 2.2 AA floor.
- **Patterns covered:** perceptual rules, focus, keyboard, touch, bilingual + bidi, reduced motion, screen reader, automated audit (`@axe-core/playwright`), manual checks, color-independent cues, reduced-motion cues, bilingual fixtures, anti-patterns.
- **Connects to:** `11-11-react-patterns`, `11-11-ui`, `11-11-playwright`.

### 5. 11-11-cloudflare-workers
- **Stack pinned:** wrangler 4.120, Drizzle 0.45, vitest pool workers 0.21.
- **Patterns covered:** local dev, D1 migrations, Durable Objects (chess realtime), R2, KV, Pages Functions, secrets/env, tests, deploy, MCP-driven lookup, anti-patterns.
- **Connects to:** `11-11-chess` (DO realtime), `11-11-kilo-config` (MCP setup).

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Skill description too narrow, agent skips it | Each description names explicit triggers ("use for X, Y, Z") and what NOT to touch. |
| Skill contradicts a frozen system | Every skill ends with "What is frozen and must not change" pointing to AGENT_RULES.md. |
| Skill duplicates existing one | All 5 fill a verified gap from the Wave 0 audit (no React/3D/Playwright/A11y/Cloudflare skills existed). |
| Mirror skills drift from canonical | Mirrors are short pointers, not full content. Edit canonical, mirror auto-refers. |
| Increased skill scan time | 10 added skills (canonical + mirror) out of 60 total is < 20% overhead. |

---

## Files NOT Touched

The following were intentionally left untouched per the frozen-systems rule:

- Any file under `artifacts/eleven-eleven/src/`
- Any file under `artifacts/eleven-eleven/functions/`
- Any file under `artifacts/eleven-eleven/migrations/`
- Any file under `artifacts/eleven-eleven/public/`
- `artifacts/eleven-eleven/AGENT_RULES.md`
- `artifacts/eleven-eleven/wrangler.toml` / `wrangler.jsonc`
- `artifacts/eleven-eleven/vite.config.ts`
- `artifacts/eleven-eleven/package.json`
- Any puzzle, lore, ending, achievement, cinematic, or production asset
- The 25 existing skills (no edits, no deletions, no content rewrites)

---

## Environment Health

| Check | Result |
|---|---|
| YAML frontmatter valid for all 10 new files | ✅ PASS (matches existing skill template exactly) |
| No game code modified | ✅ PASS |
| No frozen paths touched | ✅ PASS |
| No secrets/tokens added | ✅ PASS |
| Mirror + canonical pattern correct | ✅ PASS |
| `/help` updated | ✅ PASS |
| Total skill count documented | ✅ PASS (50 → 60) |

**Wave 2 Verdict: PASS — complete, scoped, safe.**

---

## Recommended Next Waves

Per the original upgrade plan, the next priorities are (awaiting owner approval):

**Wave 3 (Commands + Plugin):**
- `/security` command (npm audit, secrets scan, OWASP, Canon scan)
- `/debug` command (console error triage, build error triage, doctor drill-down)
- Enhance `.kilocode/plugin/11-11-guard.ts` with pre/post validation hooks

**Wave 4 (More Skills, lower priority):**
- `11-11-typescript-advanced` (branded types, discriminated unions)
- `11-11-save-systems` (localStorage, IndexedDB, Firebase, conflict resolution)
- `11-11-progression-systems` (XP, levels, streaks, anti-dark-pattern)
- `11-11-multiplayer` (WebSockets, DO, presence)
- `11-11-game-architecture` (feature/domain/infrastructure layering)
- `11-11-firebase` (Firestore rules, auth, security)
- `11-11-bundle-analysis` (vite visualizer, chunk splitting, gzip sizes)

**Wave 5 (Documentation + Cleanup):**
- Update `artifacts/eleven-eleven/AGENT_RULES.md` skill index to reference new skills
- Update root `AGENTS.md` to mention the new agents
- Re-evaluate disabled MCPs after one week of use

---

**END OF WAVE 2 REPORT**

Awaiting owner approval before proceeding to Wave 3.
