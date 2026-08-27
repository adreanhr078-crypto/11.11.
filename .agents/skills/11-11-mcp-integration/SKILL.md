---
name: 11-11-mcp-integration
description: >-
  Integrate external MCP (Model Context Protocol) servers and tools into the
  11.11 Kilo environment. Use when the project needs to connect new data
  sources, external APIs, or AI services via MCP. Covers MCP server
  registration in kilo.json, environment variable setup, and security
  boundaries. Do not modify game logic or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-mcp-integration
    license: project-internal
---

# 11.11 MCP Integration Skill

MCP servers extend Kilo's capabilities by exposing external tools and data sources. All MCP integrations must respect the project's security boundaries and never expose secrets, tokens, or player data.

## Active MCP configuration

- **Config file:** `.kilo/kilo.json` contains the `mcp` block.
- **Existing servers:**
  - `airbyte-agent-mcp` (remote)
  - `airbyte-knowledge-mcp` (remote)
  - `astronomer-docs-mcp` (remote)
  - `awslabs-kinesis-mcp-server` (local, uvx)
  - `amazon-keyspaces-mcp` (local, uvx)
  - `aws-redshift-mcp` (local, uvx)
- **No skills are registered in kilo.json** — skills are discovered via `.agents/skills/` and `.kilo/skills/` paths automatically.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `.kilo/kilo.json` and the project's `.env`/`.dev.vars` patterns before adding new MCP servers.
3. Add new MCP servers to the `mcp` block in `.kilo/kilo.json` with appropriate `type`, `command`/`url`, and `environment`.
4. Never add API keys, tokens, or credentials to `kilo.json`. Use environment variables or local secret files.
5. Validate the MCP server with `npx kilocode mcp list` or equivalent before declaring success.
6. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Security rules

- Read-only MCP servers should be flagged with explicit read-only environment variables (e.g., `KINESIS-READONLY=true`).
- Remote MCP servers must use HTTPS.
- Local MCP servers should specify explicit versions in `uvx` commands (e.g., `awslabs.kinesis-mcp-server==0.1.2`).
- No player data, secrets, or credentials may be logged or exposed through MCP tool outputs.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
