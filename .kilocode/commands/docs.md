---description: Write or update documentation for the 11.11 project.---
# /docs — Documentation Tasks

Write or update project documentation: SKILL.md, README, API docs, story docs.

## Usage

/docs <type> <target> — where type is one of:
- `skill <name>` — write/update a skill SKILL.md
- `readme` — write/update README
- `api <endpoint>` — document an API endpoint
- `reference <topic>` — write a reference doc
- `changelog` — update changelog

## Skill format

```markdown
---
name: <kebab-case-name>
description: <short description of when to use this skill>
metadata:
  category: game-development | tooling | documentation
  source:
    repository: <url>
    path: <path>
    license: <license>
---

# <Skill Title>

Brief description.

## Active implementation facts

Code patterns, file locations, current state.

## Required workflow

Pre-flight -> workflow steps -> post-flight.

## Domain-specific rules

Domain constraints.

## What is frozen and must not change

Protected systems.
```

## Active documentation files

- `.agents/skills/` — 25 skills for AI agents
- `.kilo/skills/` — 24 skills (some mirrored)
- `artifacts/eleven-eleven/AGENT_RULES.md` — project rules
- `AGENTS.md` — repository agent instructions
- `artifacts/eleven-eleven/CODEX_HANDOFF_CHECKPOINT_*.md` — handoff notes
- `artifacts/eleven-eleven/PHASE_1_CHECKPOINT.md` — phase 1 checkpoint
- `artifacts/eleven-eleven/ECHO_MIND_AI_SETUP.md` — Echo Mind setup
- `artifacts/eleven-eleven/AWAKENING_WARD_IMPLEMENTATION.md` — Ward implementation

## Skills to load

- `$11-11-kilo-config` — Kilo configuration
- `$11.11-autonomous-quality-gate` — quality standards
