---
name: 11-11-unity
description: >-
  Author or export Unity-based interactive scenes, shaders, or gameplay
  prototypes for future 11.11 perspectives and modes. Use when the project
  needs Unity CLI automation, C# script scaffolding, asset bundle export, or
  Unity Cloud Build integration. Unity is not wired into the current React
  runtime; this skill prepares future integration surfaces. Do not modify
  frozen 11.11 game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-unity
    license: project-internal
---

# 11.11 Unity Skill

Unity is a future-facing perspective layer for 11.11. The current runtime is
React + Three.js + Phaser. Unity assets are authored, exported, and tested
in isolation until an integration surface is approved.

## Active implementation facts

- **Current runtime:** React 19 + Three.js + Phaser + Vite. Unity is not
  embedded yet.
- **Export targets:** GLB/GLTF for 3D models, WebM for cinematics, PNG/WebP
  for textures.
- **Blender bridge:** Blender can export directly to GLB/GLTF for Unity
  ingestion.
- **Asset destinations:** `public/assets/ui/<surface>/`, `public/assets/cinematics/`.
- **Build tooling:** Unity CLI (`Unity`), Unity Cloud Build, or
  `unity-editor` package for CI.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the approved integration surface before authoring Unity content.
3. Author Unity scenes/assets. Export as GLB/GLTF, WebM, or image sequence.
4. Validate exports with Blender/ImageMagick/FFmpeg before integration.
5. Store exports under `public/assets/` with lazy loading and CSS fallback.
6. Do not embed Unity WebGL builds into the current runtime until approved.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## CLI integration

```bash
# Headless batch export (example)
Unity -batchmode -quit -projectPath ./UnityProject \
  -executeMethod ExportPipeline.ExportAll -logFile unity-export.log
```

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
