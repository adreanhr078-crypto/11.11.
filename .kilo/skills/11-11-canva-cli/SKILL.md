---
name: 11-11-canva-cli
description: >-
  Invoke Canva API from the agent to generate or edit graphic assets for
  11.11. Use tools/canva/run-canva.ts as the entry point. Requires
  CANVA_API_KEY environment variable. Do not modify frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-canva-cli
    license: project-internal
---

# 11.11 Canva CLI Skill

This skill provides the actual CLI interface for Canva API operations that
the agent can invoke programmatically.

## Entry point

- `CANVA_API_KEY=xxx npx tsx tools/canva/run-canva.ts -- create-design --title "11.11 Asset" --width 1024 --height 1024`
- `CANVA_API_KEY=xxx npx tsx tools/canva/run-canva.ts -- export-design --design-id <id> --format png`

## Environment requirements

- Canva API key with appropriate tier.
- Node.js 22+ for `npx tsx`.

## Error handling

- Exit code non-zero = API call failed. Capture stderr for diagnostics.
- 401 = invalid API key. 429 = rate limited.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
