---
name: 11-11-3d-pipeline
description: >-
  End-to-end 11.11 production pipeline for Blender-authored GLB assets,
  cinematic frame sequences, optimized WebM/MP4, image validation, and
  Three/R3F integration. Use for any 3D, cinematic, model, texture, or
  production-media change. Preserve Canon and server-owned gameplay.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-3d-pipeline
    license: project-internal
---

# 11.11 3D Pipeline

The active runtime is web-first: Blender authors assets and Three/R3F renders
interactive GLB. Unity is deferred until a measured browser vertical slice
fails its quality or performance gate. Never introduce another runtime merely
because it is installed.

## Required lifecycle

1. Run `npm run agent:preflight` from `artifacts/eleven-eleven`.
2. Read `AGENT_RULES.md`, the UI visual contract, Blender pipeline reference,
   and the current Canon source register.
3. Run `npm run env:check` from the repository root.
4. Use the lightest format that earns its cost:
   - React/CSS for live UI and readable text.
   - Sprites/static layers for parallax.
   - WebM/MP4 plus poster for fixed cinematics.
   - GLB only for interaction that benefits from real-time depth.
5. Export to ignored intermediate storage, validate, optimize, validate again,
   then publish only the approved optimized output.
6. Integrate with lazy loading, reserved dimensions, loading/error fallback,
   Reduced Motion, mute, and a non-WebGL fallback.
7. Run `npm run media:validate`, browser/runtime verification when applicable,
   and the mandatory autonomous quality gate.

## Canon and draft rules

- The approved Story Bible is an evolving Canon source; draft Manhwa pages are
  visual direction until their dialogue and final sequence are locked.
- Do not bake readable Arabic/English UI text into Blender, images, or video.
- Echo's approved direct-skin neck mark is `EX-011`; keep it as a replaceable
  decal so Zero corruption can evolve around it without replacing the mark.
- Zero appears only according to the Story Bible's progressive reveal rule.
- Generated concepts are not production assets until source, rights, visual
  continuity, performance, and integration are documented.

## Commands

```bash
npm run env:check
npm run media:smoke
npm run media:validate
npm run blender:doctor
npm run blender:export-gltf -- --blend scene.blend --output model.raw.glb
npm run gltf:validate -- --input model.raw.glb --strict
npm run gltf:optimize -- --input model.raw.glb --output model.glb --profile character --texture-mode ktx2
npm run cinematic:encode -- --input frame_%04d.png --output scene.webm --poster scene.webp --fps 24
```

`media:smoke` must prove Blender scene creation, GLB export, Khronos validation,
Meshopt/KTX preparation, Blender re-import, PNG rendering, FFmpeg encoding, and
poster extraction without requiring system installation.

## Production budgets

The source of truth is `tools/media/asset-budgets.json`. Do not weaken budgets
to make an asset pass. Optimize the asset or document a measured exception.
Interactive character clips must resolve at least Idle, Walk, Run, and
Interact. One rig may produce GLB, a Mini Echo sprite atlas, and fixed WebM.

## Tool policy

- Required: portable Blender, FFmpeg/ffprobe, portable KTX tools, pinned glTF
  Transform, Khronos validator, Sharp, and Microsoft Edge.
- ImageMagick is optional; Sharp is the supported fallback.
- ComfyUI is deferred on low-memory Intel-UHD hardware. Connected image/video
  applications may be used for concepts only under the rights rule above.
- Audacity is deferred until approved VO/SFX exists.

## Frozen authority

Do not modify puzzle solutions, rewards, receipts, achievements, progression,
authentication, story endings, or Canon state from presentation tooling.
