---
name: 11-11-blender-cli
description: >-
  Invoke Blender headless commands from the agent to export GLB models or
  render cinematic PNG sequences. Use tools/blender/run-blender.ts as the
  entry point. Requires Blender installed and on PATH. Do not modify frozen
  game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-blender-cli
    license: project-internal
---

# 11.11 Blender CLI Skill

This skill provides the actual CLI interface for Blender operations that
the agent can invoke programmatically.

## Entry points

- `npx tsx tools/blender/run-blender.ts -- export-gltf --blend <file> --output <path> [--collection <name>]`
- `npx tsx tools/blender/run-blender.ts -- render-cinematic --blend <file> --output-dir <dir> --start <frame> --end <frame> --fps <fps>`

## Blender Python scripts

- `tools/blender/export_glb.py` — exports selected collection to GLB.
- `tools/blender/render_cinematic.py` — renders PNG sequence from Blender scene.

## Environment requirements

- Blender 3.0+ installed and on PATH (`blender` on macOS/Linux, `blender.exe` on Windows).
- Python 3.9+ (bundled with Blender).
- Node.js 22+ for `npx tsx`.

## Error handling

- Exit code non-zero = Blender failed. Capture stdout/stderr for diagnostics.
- Missing blend file = agent must verify path before invoking.
- No Blender on PATH = tool reports missing; agent should fall back to pre-authored assets.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
