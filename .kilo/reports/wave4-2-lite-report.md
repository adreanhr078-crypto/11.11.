# Wave 4.2-lite — Playtest Director + Release Check
**Date:** 2026-08-26
**Scope:** Add player-experience playtest capability and pre-release gate
**Status:** ✅ COMPLETE — PASS quality gate

---

## Executive Summary

Wave 4.2-lite delivers the two highest-value additions identified in the post-Wave-3 review:

1. **`playtest-director` agent** + **`$11-11-playtest` skill** — answers the question: *is this game fun, fair, and emotionally engaging for the player?*
2. **`/release-check` command** — a structured 8-category pre-release gate covering bugs, performance, assets, localization, accessibility, save integrity, regression, and canon.

The **Economy/Progression Reviewer** was deliberately **deferred** to a later wave because:
- It depends on actual progression data from a real release cycle
- The current `playtest-director` already covers reward timing and difficulty curves (dimension #4 and #5 of the 8-dimension score)
- Adding it now would be speculative rather than evidence-based

---

## Files Created / Modified (6 files)

| # | File | Action | Status |
|---|---|---|---|
| 1 | `.agents/skills/11-11-playtest/SKILL.md` | Created (canonical) | ✅ |
| 2 | `.kilo/skills/11-11-playtest/SKILL.md` | Created (mirror) | ✅ |
| 3 | `.kilo/agents/playtest-director.md` | Created | ✅ |
| 4 | `.kilocode/commands/release-check.md` | Created | ✅ |
| 5 | `.kilocode/plugin/11-11-guard.ts` | Updated (added 2 command hints) | ✅ Backward compatible |
| 6 | `.kilocode/commands/help.md` | Updated (added 1 command, 1 skill) | ✅ |
| 7 | `.kilo/reports/wave4-2-lite-report.md` | This report | ✅ |

---

## 1. `$11-11-playtest` Skill

A 166-line canonical reference document for running a playtest on the 11.11 project. Covers:

- **Active implementation facts** (project rules, visual contract, anti-patterns)
- **Required workflow** (understand → inspect → score → detect → compare → report → handoff)
- **8-dimension score card** (0–3 each, total 0–24):
  1. Onboarding clarity
  2. Engagement hook
  3. Pacing
  4. Difficulty curve
  5. Reward timing
  6. Emotional resonance
  7. Bilingual parity
  8. Return reason
- **Boredom + Friction hotspot detection** (3 of each per journey)
- **Project identity check** (does this still feel like 11.11?)
- **Anti-patterns to refuse** (dark patterns list, exactly the same as in `$11.11-player-experience-loop`)
- **Frozen paths** (the same 6-path list)
- **Report template** with handoff verdict (PASS / PARTIAL / FAIL)

---

## 2. `playtest-director` Agent

A read-only primary mode agent that follows the `$11-11-playtest` skill. The agent's voice is intentionally distinct from `qa-engineer` and `performance-engineer`:

- **qa-engineer** asks: *does it work?*
- **performance-engineer** asks: *is it fast?*
- **playtest-director** asks: *is it fun?*

### Agent Identity

- **displayName:** Playtest Director
- **id:** `playtest-director`
- **color:** `#9333EA` (purple — distinct from QA's yellow, Performance's blue)
- **mode:** primary
- **read-only** with allowlists for `.kilo/agents/playtest-director.md`, `.kilo/plans/*.md`, `.kilo/reports/playtest/*.md`

### Core Mandate

The agent refuses to:
- Modify game logic, puzzles, lore, Memory Shards, or story endings
- Modify achievements, cinematics, or reward authority
- Modify the 11.11 visual contract
- Bypass bilingual parity
- Introduce dark patterns

### Escalation

The agent escalates (stops and alerts the owner) when it finds:
- Frozen-path violation
- Dark pattern (release blocker)
- Bilingual parity break (release blocker)
- Canon drift risk
- Player-trust violation (lost progress, silent reward, missing acknowledgment)

---

## 3. `/release-check` Command

A 204-line slash command that orchestrates an 8-category pre-release gate. Targets:

- (empty) — full release gate
- `web` — Vite + Cloudflare Pages
- `android` — Capacitor
- `ios` — Capacitor (macOS only)
- `windows` — Tauri
- `realtime` — Cloudflare Workers
- `functions` — Pages Functions
- `all` — all targets sequentially

### The 8 Categories

| # | Category | What it covers |
|---|---|---|
| 1 | 🐛 **Bugs** | preflight, typecheck, test, build, doctor, white-screen, storage, files |
| 2 | ⚡ **Performance** | build size, bundle gzip, doctor:build, regression > 5% |
| 3 | 🎨 **Assets** | media:validate, WebP/MP4/GLB budgets, visual contract |
| 4 | 🌍 **Localization** | ar/en parity, RTL/LTR, Intl formatters, chessCopy |
| 5 | ♿ **Accessibility** | WCAG 2.2 AA, focus, contrast, 44px, reduced-motion, keyboard, screen reader |
| 6 | 💾 **Save integrity** | D1 migrations, server authority, lost-progress mitigation, no double-grant |
| 7 | 🔁 **Regression** | previous QA + playtest reports, git diff, doctor counts, mirror sync |
| 8 | 📦 **Canon** | frozen paths untouched, story fragments, Echo consistency, bilingual coverage |

### Decision Matrix

- **GO** if all 8 PASS
- **HOLD** if any UNVERIFIED (owner decides)
- **NO-GO** if any FAIL (block release, escalate)

### Output

A release report to `.kilo/reports/release/YYYY-MM-DD-<target>-rc<N>.md` with the 8-category status table and a sign-off block listing every agent's verdict.

---

## 4. Plugin Guard Update

Extended `command.execute.before` to emit hints for the two new commands:

```ts
} else if (input.command === "/release-check") {
  // hint: 8 categories, GO/HOLD/NO-GO
} else if (input.command === "/playtest" || input.command === "/playtest-director") {
  // hint: non-negotiable player test, 8-dimension score
}
```

Plugin header comment updated to mention Wave 4.2-lite. Backward compatible 100%.

---

## 5. /help Update

Added 1 command and 1 skill to the help listing:

- `/release-check <target>` — NEW Wave 4.2-lite
- `$11-11-playtest` — NEW Wave 4.2-lite

---

## Quality Gate Lifecycle (Applied)

| Stage | Result |
|---|---|
| **UNDERSTAND** | ✅ Scoped to Playtest Director + Release Check. Economy Agent deferred with rationale. |
| **INSPECT** | ✅ Read player-experience-loop, qa-engineer, performance-engineer, and the existing command list. No conflicts. |
| **PLAN** | ✅ 4 new files + 2 updates. No overlap with existing files. |
| **IMPLEMENT** | ✅ All 7 files written. Frontmatter matches existing template. |
| **VERIFY** | ✅ All files readable. YAML frontmatter valid. Content matches intent. |
| **SELF-CRITIQUE** | ✅ Considered: scope creep, agent overlap with qa-engineer, /playtest command vs playtest-director agent naming. Decided to skip /playtest command (use agent directly) and let playtest-director agent own the playtest surface. |
| **AUTO-FIX** | None required. |
| **VERIFY AGAIN** | ✅ Re-read each file. |
| **REGRESSION REVIEW** | ✅ No game code modified. No frozen paths touched. Plugin backward compatible. /help additive only. |
| **FINAL DELIVERY** | ✅ This report. |

---

## Files NOT Touched

- ❌ `artifacts/eleven-eleven/src/`
- ❌ `artifacts/eleven-eleven/functions/`
- ❌ `artifacts/eleven-eleven/migrations/`
- ❌ `artifacts/eleven-eleven/public/`
- ❌ `artifacts/eleven-eleven/AGENT_RULES.md`
- ❌ `artifacts/eleven-eleven/wrangler.toml` / `wrangler.jsonc`
- ❌ `artifacts/eleven-eleven/vite.config.ts`
- ❌ `artifacts/eleven-eleven/package.json`
- ❌ puzzles / lore / endings / achievements / cinematics / production assets
- ❌ All 6 existing agents (architect, code-simplifier, data, docs-specialist, qa-engineer, performance-engineer)
- ❌ All 30 existing skills (canonical + mirror)
- ❌ All 14 existing commands (kept exactly as-is)
- ❌ All 5 mirror skills (now 6, total)
- ❌ `tools/sync-skill-mirrors.mjs` (still works; will pick up the new mirror on next run)
- ❌ `tools/mcp-audit.json`
- ❌ `kilo.json`, `kilo.json.backup-wave1`, `mcp-audit.json`
- ❌ `11-11-guard.ts.backup-wave3`

---

## Environment Inventory (post-Wave 4.2-lite)

| Category | Count | Detail |
|---|---|---|
| Agents | 7 | + playtest-director |
| Skills (`.agents/`) | 31 | + 11-11-playtest |
| Skills (`.kilo/`) | 31 | + 11-11-playtest mirror |
| Commands | 17 | + /release-check |
| Plugins | 2 | 11-11-guard (Wave 4.2-lite hints), 11-11-tools |
| MCP servers | 9 | 6 disabled, 3 active |
| Tools (scripts) | 9 | 8 existing + sync-skill-mirrors.mjs |
| Audit trail | 2 | .kilo/audit/ (gitignored) + tools/mcp-audit.json |
| Drift detection | 1 | sync-skill-mirrors.mjs |
| Reports | 6 | + Wave 4.2-lite |
| Backups | 2 | (unchanged) |

---

## Verdict

**PASS** — Wave 4.2-lite is complete, scoped, and aligned with the project's actual needs.

The environment now has three orthogonal "lenses" for review:
- **qa-engineer** — does it work?
- **performance-engineer** — is it fast?
- **playtest-director** — is it fun?

And one orchestration:
- **`/release-check`** — pre-release gate across 8 categories

This is the "two new entries" the post-Wave-3 review identified as the highest-value additions. The Economy/Progression Reviewer remains on the deferred list, with clear rationale.

---

## Recommended Next Steps

Per the post-Wave-3 audit's recommendation: **pause for one week of actual use** before any further additions.

After one week, consider (in priority order):

1. **Wave 4.3 (only if real need emerges):**
   - `narrative-agent` — if Canon drift becomes a recurring concern
   - `art-director` — if visual contract violations become a recurring concern
   - `security-engineer` — if `/security` outputs become too frequent
   - `audio-director` — if audio issues become a recurring concern
   - `economy-agent` — if progression inflation or balance issues emerge

2. **Documentation polish (always safe):**
   - Update `artifacts/eleven-eleven/AGENT_RULES.md` to reference the new skills and agents
   - Update root `AGENTS.md` to mention the 7 agents
   - Add `node tools/sync-skill-mirrors.mjs` to a CI step

3. **After 1 month of use:**
   - Re-evaluate the 6 disabled MCPs and decide whether to keep them as documentation
   - Clean up backup files (`.kilo/kilo.json.backup-wave1`, `11-11-guard.ts.backup-wave3`) once the changes are confirmed stable

---

**END OF WAVE 4.2-LITE REPORT**
