---
name: 11-11-blender
description: >-
  Author 3D scenes, export GLB/GLTF interactive assets or WebM/MP4 cinematics,
  and optimize Blender outputs for the 11.11 web/mobile runtime. Use for Echo
  transformations, chess entrances, ward environments, props, and cinematic
  keyframes. Read the visual contract and blender pipeline references before
  authoring. Do not modify game logic, puzzle canon, or reward authority.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-blender
    license: project-internal
---

# 11.11 Blender Skill

Blender is the primary 3D authoring tool for 11.11 cinematic and interactive assets. All Blender outputs are optional, lazy-loaded, and subordinate to the visual contract.

## Active implementation facts

- **Blender pipeline reference:** `.agents/skills/11-11-ui/references/blender-pipeline.md` defines export choices, scene checklist, and acceptance evidence.
- **Visual contract reference:** `.agents/skills/11-11-ui/references/visual-contract.md` defines palette, materials, and prompt scaffold.
- **Export formats:**
  - **GLB/GLTF** for interactive 3D scenes that need genuine player control.
  - **WebM (VP9)** first, MP4 (H.264) only where WebM is not supported, for fixed cinematic sequences.
  - **PNG sequence / sprite atlas** for parallax layers and particles that do not need live geometry.
- **Asset destinations:**
  - Interactive GLB → `public/assets/ui/<surface>/`
  - Cinematic video → `public/assets/cinematics/`
  - Sprite layers → `public/assets/ui/<surface>/` or surface-specific atlas
- **Lazy loading rule:** Blender outputs must be loaded only after the player chooses the surface. Reserve dimensions and supply a CSS gradient/solid fallback.

## Scene authoring checklist

1. Block a single clear focal moment that supports the game state.
2. Use deliberate camera path, restrained signal-crimson lighting, readable silhouette.
3. Animate particles/effects only for transitions, transformations, consequences, rewards.
4. Render a static poster/fallback frame before the sequence for reduced motion / mute / failure states.
5. Optimize geometry, materials, texture resolution, duration, and encoding before export.
6. Inspect exported asset for framing, clipping, alpha/codec compatibility, and accidental text/logos.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `blender-pipeline.md` and `visual-contract.md` before opening Blender.
3. Author the scene in Blender. Export using the lightest suitable format.
4. Validate the export with ImageMagick/FFmpeg before copying into `public/assets/`.
5. Integrate the asset with lazy loading, reserved dimensions, and CSS fallback.
6. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## CLI integration

- Use `blender --background --python script.py` for headless batch exports in CI.
- Use `ffmpeg` to compress Blender outputs to target bitrate and check codec compatibility.
- Use `imagemagick` to verify alpha channels and generate fallback frames.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
