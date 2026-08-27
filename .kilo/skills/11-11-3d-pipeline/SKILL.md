---
name: 11-11-3d-pipeline
description: >-
  End-to-end 3D asset pipeline for 11.11: author in Blender, export GLB/GLTF
  for Three.js or future Unity, encode WebM cinematics with FFmpeg, pack
  sprites with ImageMagick, and validate for lazy-loading budgets. Use this
  skill as the unified entry point for all 3D/cinematic/image work. Do not
  modify frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-3d-pipeline
    license: project-internal
---

# 11.11 3D Pipeline Skill

This skill unifies Blender, FFmpeg, ImageMagick, and Three.js/GLB
integration into a single workflow for 11.11 cinematic and interactive 3D.

## Pipeline stages

1. **Author:** Blender → GLB (interactive) or PNG sequence (cinematic).
2. **Validate:** ImageMagick/FFmpeg → alpha, codec, size, duration checks.
3. **Compress:** FFmpeg → WebM (VP9) or MP4 (H.264) with target bitrate.
4. **Integrate:** Lazy-load in React/Three.js with reserved dimensions + CSS fallback.
5. **Verify:** Browser runtime evidence, reduced-motion fallback, mute state.

## Active implementation facts

- **Three.js:** `@react-three/fiber` and `@react-three/drei` are installed.
- **GLB loading:** Use `useGLTF` from `@react-three/drei` for lazy-loaded models.
- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md`.
- **Blender pipeline:** `.agents/skills/11-11-ui/references/blender-pipeline.md`.
- **Awakening Ward:** Uses Phaser isometric sprites exported from Blender.
- **Existing GLB/cinematic assets:** `public/assets/cinematics/` and `public/assets/ui/`.

## Command-line examples

```bash
# Blender: export GLB from blend file
blender --background scene.blend --python export_glb.py

# Blender: render PNG sequence
blender --background scene.blend --python render_sequence.py

# FFmpeg: PNG sequence → WebM
ffmpeg -y -framerate 24 -i frame_%04d.png -c:v libvpx-vp9 -crf 30 -b:v 0 output.webm

# ImageMagick: verify alpha
magick identify -format "%A" model.glb
```

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the visual contract and blender pipeline references.
3. Author in Blender, export with the lightest suitable format.
4. Validate with ImageMagick/FFmpeg.
5. Integrate with lazy loading + CSS fallback.
6. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
