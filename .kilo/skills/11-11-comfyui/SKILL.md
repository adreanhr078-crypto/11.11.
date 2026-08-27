---
name: 11-11-comfyui
description: >-
  Invoke ComfyUI API from the agent to generate AI images locally using
  Stable Diffusion. Use tools/stable-diffusion/run-comfyui.ts as the entry
  point. Requires ComfyUI running locally. Do not modify frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-comfyui
    license: project-internal
---

# 11.11 ComfyUI Skill

This skill provides the actual CLI interface for ComfyUI operations that
the agent can invoke programmatically.

## Entry point

- `COMFYUI_URL=http://127.0.0.1:8188 npx tsx tools/stable-diffusion/run-comfyui.ts -- generate --prompt "obsidian chess board" --output ./output.png`

## Environment requirements

- ComfyUI running locally (default: http://127.0.0.1:8188).
- Node.js 22+ for `npx tsx`.

## Error handling

- Exit code non-zero = API call failed. Capture stderr for diagnostics.
- Connection refused = ComfyUI not running. Agent should report UNVERIFIED.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
