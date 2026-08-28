---
name: 11-11-blender-cli
description: >-
  Run the portable 11.11 Blender toolchain headlessly for deterministic scene
  creation, GLB export and re-import validation, or cinematic PNG rendering.
  Use tools/blender/run-blender.ts and never require a system installer.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-blender-cli
    license: project-internal
---

# 11.11 Blender CLI

## Environment contract

- Supported production baseline: Blender 5.2 LTS portable.
- Resolve the executable from task-specific `BLENDER_EXE`, the user's saved
  environment value, PATH, then the verified portable path.
- `run-blender.ts` always uses background mode and `--python-exit-code 1`.
- Never invoke an MSI/EXE installer or modify machine PATH from this skill.

## Entry points

```bash
npm run blender:doctor
npm run blender:smoke
npx tsx tools/blender/run-blender.ts -- run-python --script <script.py> -- <script args>
npx tsx tools/blender/run-blender.ts -- export-gltf --blend <scene.blend> --output <raw.glb> [--collection <name>]
npx tsx tools/blender/run-blender.ts -- render-cinematic --blend <scene.blend> --output-dir <frames> --start 1 --end 120 --fps 24
```

## Scripts and guarantees

- `create_smoke_scene.py`: creates a tiny non-Canon deterministic test scene.
- `export_glb.py`: GLB 2.0 export with animations, without cameras or lights.
- `validate_glb_reimport.py`: proves Blender can re-import the optimized GLB.
- `validate_character_glb.py`: checks rig, direct-skin identifier decal,
  animation names, and production complexity ceilings.
- `render_cinematic.py`: PNG sequence only; FFmpeg performs delivery encoding.

Raw exports belong in ignored intermediate storage. Validate with the Khronos
validator, optimize with the pinned glTF Transform/KTX2 path, validate again,
then re-import before publication. A successful Blender exit alone is not proof
that a model is visually correct or performant.

## Failure policy

- Missing file, collection, output, mesh, or animation is a hard failure.
- Non-zero Blender exit is a hard failure; capture stdout/stderr.
- If visual runtime evidence is unavailable, report it as unverified.
- Never bypass a failure by reducing quality budgets or hiding validation.

## Frozen authority

Blender output contains no readable live UI text and no authoritative puzzle,
reward, achievement, progression, authentication, or Canon state.
