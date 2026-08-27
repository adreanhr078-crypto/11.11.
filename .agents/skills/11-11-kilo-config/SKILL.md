---
name: 11-11-kilo-config
description: >-
  Manage Kilo configuration, permissions, commands, agents, skills, MCPs,
  providers, TUI settings, and environment setup for the 11.11 project. Use
  when configuring kilo.json, registering skills, adding MCP servers, setting
  up agents, or troubleshooting Kilo environment issues. Do not modify game
  logic or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-kilo-config
    license: project-internal
---

# 11.11 Kilo Config Skill

Kilo is the agent orchestration layer for 11.11 development. Its configuration lives in `.kilo/kilo.json` and skills are discovered from `.agents/skills/` and `.kilo/skills/`.

## Active configuration facts

- **Main config:** `.kilo/kilo.json` — contains only MCP server definitions, no skill registration.
- **Skills discovery:** Kilo automatically scans `.agents/skills/*/SKILL.md` and `.kilo/skills/*/SKILL.md` directories.
- **Agents:** `.kilo/agents/*.md` — contains 4 agent definitions (architect, code-simplifier, data, docs-specialist).
- **Commands:** No custom commands exist; `.kilo/command/*.md` is absent.
- **Agent Manager state:** `.kilo/agent-manager.json` tracks worktrees and sessions.
- **Snapshot mode:** `.kilo/kilo.jsonc` contains `{ "snapshot": false }`.

## Required workflow

1. Run `npm run agent:preflight` before any config change. Stop on failure.
2. Read `.kilo/kilo.json` and the existing skills directory listing before making changes.
3. Skills are auto-discovered — do not manually register them in `kilo.json`.
4. MCP servers must be added to the `mcp` block in `.kilo/kilo.json`.
5. Validate Kilo can discover new skills by checking the available skills list after restart.
6. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Adding a new skill

1. Create `SKILL.md` in either `.agents/skills/<name>/` or `.kilo/skills/<name>/`.
2. Include frontmatter with `name`, `description`, and `metadata` (category, source).
3. Write the skill content following the 11.11 project rules and quality gate.
4. Restart Kilo session to discover the new skill.

## Adding a new MCP server

1. Edit `.kilo/kilo.json`.
2. Add a new entry to the `mcp` object with `type`, and either `url` (remote) or `command` (local).
3. For local servers using `uvx`, pin the package version.
4. Never hardcode secrets in `kilo.json`.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
