---
name: 11-11-unity-cli
description: >-
  Invoke Unity headless batch commands from the agent for asset export or
  Cloud Build integration. Use tools/unity/run-unity.ts as the entry point.
  Requires Unity installed. Unity is not yet wired into the React runtime;
  exports feed the 3D pipeline. Do not modify frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-unity-cli
    license: project-internal
---

# 11.11 Unity CLI Skill

This skill provides the actual CLI interface for Unity operations that
the agent can invoke programmatically.

## Entry point

- `npx tsx tools/unity/run-unity.ts -- -projectPath <path> -executeMethod <method> -logFile <path>`

## Example calls

```bash
# Batch export
npx tsx tools/unity/run-unity.ts -- -projectPath ./Unity11 -executeMethod ExportPipeline.ExportAll -logFile unity.log

# Run tests
npx tsx tools/unity/run-unity.ts -- -projectPath ./Unity11 -runTests -testPlatform EditMode -logFile test.log
```

## Environment requirements

- Unity 2022.3+ installed.
- `Unity` on PATH (Windows) or `/Applications/Unity/Hub/Editor/.../Unity` (macOS).
- Node.js 22+ for `npx tsx`.

## Error handling

- Exit code non-zero = Unity failed. Capture log for diagnostics.
- Long-running operations should use timeout wrappers.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
