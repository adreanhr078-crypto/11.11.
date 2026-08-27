---
name: 11-11-playtest
description: Run a player-experience playtest review for the 11.11 project. Use when assessing onboarding, flow, difficulty, pacing, hook, reward timing, and engagement quality. Companion to the `$11.11-player-experience-loop` skill and the `playtest-director` agent. Do not modify game logic, puzzle canon, endings, achievements, or cinematics unless the task explicitly scopes to a playtest-only change.
---

# 11.11 Playtest

A 11.11 playtest is not a code review. It is a structured read of the game **as a player would experience it**, asking: *is this fun, fair, and emotionally engaging?* This skill is the playbook the `playtest-director` agent follows; it is also a reference for any human or agent running a playtest pass.

## Active implementation facts

- The project is a narrative puzzle + chess + progression game. The primary player journey is the **non-negotiable player test** defined in `$11.11-player-experience-loop`: `Login → First contact → Echo → clear objective → Manhwa/Story → puzzle or meaningful play → authoritative result → visual/audio response → Echo reaction → next objective → return reason`.
- The product rules live in `artifacts/eleven-eleven/AGENT_RULES.md` and the root `AGENTS.md`. Both are read before any playtest review.
- The 11.11 visual contract is obsidian + signal crimson + cyan signal + pale ivory; never compromise it for fun.
- The 11.11 anti-pattern list: fake scarcity, streak punishment, spam, deceptive urgency, reward farming, dark patterns, advertisements on game surfaces.

## Required workflow

For every playtest:

### 1. UNDERSTAND
- Read `AGENTS.md` and `artifacts/eleven-eleven/AGENT_RULES.md` first.
- Identify the scope: which journey, which surface, which change.
- Identify the audience: first-time player, returning daily, returning after a break, completionist.
- Load `$11.11-player-experience-loop` and `$11-11-ui` (and any other relevant skill) before reviewing.

### 2. INSPECT (read-only)
- Read the route, store, screen, audio wiring, and reward receipt path.
- Do not edit code, puzzles, lore, or assets. Take notes; do not fix.
- If you need a runtime check that requires Edge, ask the owner to drive it; do not fabricate PASS.

### 3. SCORE — The 8 Playtest Dimensions
For each dimension, score **0–3** and cite the evidence (file:line or screen observation):

| # | Dimension | What to look for | Score 0–3 |
|---|---|---|---|
| 1 | **Onboarding clarity** | First-time player knows what to do, why it matters, and how it works, within 90 seconds | 0 = lost, 1 = guesses, 2 = mostly clear, 3 = zero confusion |
| 2 | **Engagement hook** | The first 3 minutes produce a memorable moment (Echo reaction, story reveal, visual reward) | 0 = forgettable, 1 = functional, 2 = engaging, 3 = memorable |
| 3 | **Pacing** | No boring stretches, no overwhelming spikes; rhythm between story / puzzle / reward | 0 = exhausting or boring, 1 = uneven, 2 = mostly good, 3 = well-paced |
| 4 | **Difficulty curve** | Puzzles are fair: not trivial, not unfair; fail → learn → try again | 0 = trivial or impossible, 1 = inconsistent, 2 = mostly fair, 3 = well-tuned |
| 5 | **Reward timing** | Player gets feedback within 10s of any meaningful action | 0 = silent, 1 = late, 2 = mostly on time, 3 = immediate and meaningful |
| 6 | **Emotional resonance** | The Manhwa, Echo reactions, and story fragments create attachment | 0 = cold, 1 = functional, 2 = warm, 3 = emotionally moving |
| 7 | **Bilingual parity** | Arabic RTL and English LTR feel equally polished, equally readable, equally weighted | 0 = one is a translation, 1 = minor gaps, 2 = good parity, 3 = equally authored |
| 8 | **Return reason** | After closing the app, the player has a clear, non-coercive reason to come back (Daily hook, Weekly hook, Echo thread, unlocks) | 0 = no reason, 1 = obligation, 2 = genuine hook, 3 = eager to return |

**Total: 0–24.** Below 16 means the journey needs attention; 20+ means the journey is solid.

### 4. DETECT — Boredom and Friction Hotspots
For each journey, identify the **3 most boring moments** and the **3 most friction-heavy moments**:

- **Boring moment** = player is doing the same action without feedback for > 60 seconds
- **Friction moment** = player is blocked, confused, or has to repeat an action that should be automated

Write each as:
```
- [Surface:Route] Description — Evidence (file:line or observed). Suggested owner check: yes/no.
```

### 5. COMPARE — Project Identity
The 11.11 identity is:
- Cinematic manhwa/anime mood
- Bilingual Arabic / English, RTL parity
- Server-authoritative, no dark patterns
- Obsidian + crimson + ivory + cyan visual contract
- Echo as the through-line character

For each major change, ask: **does this still feel like 11.11?** If not, raise it as a `CANON_DRIFT_RISK`.

### 6. REPORT
Write to `.kilo/reports/playtest/YYYY-MM-DD-<scope>.md`:

```markdown
# Playtest Report — <scope>

**Date:** YYYY-MM-DD
**Reviewer:** playtest-director
**Surface(s):** <route, screen, journey>
**Audience:** <first-time / returning / completionist>
**Verdict:** PASS | PARTIAL | FAIL

## Score Card
| Dimension | Score | Evidence |
|---|---|---|
| Onboarding clarity | 0-3 | <file:line or observation> |
| Engagement hook | 0-3 | ... |
| Pacing | 0-3 | ... |
| Difficulty curve | 0-3 | ... |
| Reward timing | 0-3 | ... |
| Emotional resonance | 0-3 | ... |
| Bilingual parity | 0-3 | ... |
| Return reason | 0-3 | ... |
| **Total** | /24 | |

## Boredom Hotspots
1. ...
2. ...
3. ...

## Friction Hotspots
1. ...
2. ...
3. ...

## Canon Drift Risks
- ...

## Frozen-Path Audit
- [ ] No edits to frozen paths
- [ ] No edits to lore / endings / achievements / cinematics
- [ ] No edits to canonical puzzles

## Recommendations (priority order)
1. ...
2. ...
3. ...

## What You Are NOT
- You are not a coder. Hand off implementation to senior-engineer or code-simplifier.
- You are not a security auditor (security-engineer).
- You are not a performance engineer (performance-engineer).
- You are not a QA engineer (qa-engineer). Hand off test sequencing there.

## Frozen Paths (NEVER EDIT)
- `artifacts/eleven-eleven/src/puzzles.ts`
- `artifacts/eleven-eleven/src/lore.ts`
- `artifacts/eleven-eleven/src/domain/cinematics/`
- `artifacts/eleven-eleven/src/content/puzzles/`
- `artifacts/eleven-eleven/functions/api/player/_storyPuzzleDefinitions.ts`
- `artifacts/eleven-eleven/src/domain/live-challenges/smartLivePuzzleGenerator.ts`

See `artifacts/eleven-eleven/AGENT_RULES.md` section 6 for the authoritative list.

## Allowed Tooling
- All read tools
- MCP servers (playwright-mcp, cloudflare-docs-mcp, cloudflare-bindings-mcp)
- Write to `.kilo/reports/playtest/`, `.kilo/plans/`, and `.kilo/agents/playtest-director.md` only
```

### 7. HANDOFF
- **PASS** (score ≥ 20, no critical hotspots): ready for next milestone.
- **PARTIAL** (score 16-19, or 1-2 critical hotspots): needs targeted repair before next milestone.
- **FAIL** (score < 16, or 3+ critical hotspots, or Canon drift risk confirmed): do not ship; treat as a release blocker.

## Anti-patterns to refuse (in your review)

- Fake scarcity countdowns (X hours left, only Y left)
- Streak punishment (lose streak if you miss a day)
- Spam notifications
- Coercive engagement (forced tutorials, "are you sure you want to leave?")
- Reward farming incentives
- Dark patterns in onboarding
- Ads on game surfaces
- Decorative ads in chess/puzzle/cinematic routes
- Trivial or impossible puzzles (no learning loop)
- Long silent stretches (no feedback for > 10s during meaningful action)
- "You have unread items" pressure
- One-language dominance (Arabic must feel authored, not translated)

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts
- Achievement registry and cinematic scene authority
- Reward authority or duplicate-request replay rules
- Bilingual parity contract (Arabic is co-first, not a translation)
- Visual contract (obsidian, signal crimson, pale ivory, cyan signal)
- Anti-dark-pattern commitment from the root `AGENTS.md`
