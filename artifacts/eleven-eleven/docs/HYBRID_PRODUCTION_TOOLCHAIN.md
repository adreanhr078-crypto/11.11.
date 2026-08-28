# 11.11 Hybrid Production Toolchain

## Runtime decision

11.11 remains web-first. Blender authors characters, environments, animation,
and fixed cinematic frames; Three.js/React Three Fiber renders interactive GLB
inside the current application. Unity is a future greenlight decision, not a
dependency of Part 1 or the first third-person vertical slice.

This decision preserves login, server-owned rewards, puzzles, progression,
Arabic/English UI, and the existing browser/mobile reach while allowing one
character rig to produce:

- optimized GLB for third-person play;
- a small sprite atlas for Mini Echo;
- WebM/MP4 for fixed cinematic moments.

## Canon source contract

The current authority is
`docs/internal/narrative/current/ar/manifest.json`. Both approved inputs are
retained:

- Story Bible: facts, rules, relationships, reveal order, and global arc.
- Narrative Master: dramatic sequencing, emotional cadence, and scene intent.

The removed `Long Fall` archive is no longer authority. Current Manhwa pages
dated 2026-08-28 are draft visual references until their text and page order are
approved. Their embedded identifiers do not override the locked direct-skin
Echo neck mark `EX-011`. Zero uses an additive evolving visual layer around the
mark; it does not replace it.

## Draft visual direction

The supplied pages establish a strong target:

- obsidian architecture and near-black character silhouettes;
- violet memory/signal energy as the dominant supernatural material;
- crimson used sparingly for danger, transformation, and Zero pressure;
- wet reflective laboratory floors, glass chambers, cables, and digital rain;
- fractured-glass and data-disintegration motifs for memory transitions;
- warm domestic memory light as an emotional contrast to the laboratory;
- high-contrast anime faces with stable Echo/Yuki facial continuity.

Do not let violet consume all interactions. Live UI should remain primarily
black/ivory/crimson 11.11, with violet for memory/system phenomena and cyan only
for legibility-critical signals. Color is never the sole carrier of meaning.

## Portable tools

No system installer is required by the pipeline.

| Capability | Production path |
|---|---|
| Blender | `BLENDER_EXE`, verified portable Blender 5.2 LTS |
| FFmpeg | `FFMPEG_EXE` and `FFPROBE_EXE` |
| KTX2 | `TOKTX_EXE`, verified portable KTX 4.4.2 |
| GLB optimization | pinned `@gltf-transform/cli` 4.4.2 |
| GLB validation | pinned Khronos `gltf-validator` |
| Image inspection | pinned Sharp; ImageMagick optional |
| Browser QA | `EDGE_EXE`; Microsoft Edge only |

Run:

```bash
npm run env:check
npm run media:smoke
npm run media:validate
```

`media:smoke` must pass the entire non-Canon test chain: Blender scene creation,
raw GLB export, strict validation, Meshopt/KTX preparation, strict validation,
Blender re-import, PNG render, VP9 WebM encode, poster extraction, and ffprobe.

## Asset flow

```text
art/blender/source/        editable approved scenes
art/blender/scripts/       deterministic scene/rig automation
.tmp/                      ignored smoke and working output
art/blender/intermediate/  ignored raw exports
art/blender/renders/       ignored frame sequences
art/blender/exports/       ignored candidate exports
public/assets/             optimized, versioned runtime output only
```

Do not publish raw `.blend`, frame sequences, or unvalidated GLB. Never put
readable UI text or authoritative game state inside Blender output.

## Budgets

`tools/media/asset-budgets.json` is the machine-enforced source of truth.
Initial limits include:

- interactive GLB: 6 MiB, 80k triangles, 32 meshes, 16 materials, 128 joints;
- still image: 2.6 MiB, 4096px maximum dimension;
- fixed cinematic: 10 MiB, 1920×1080, VP9/H.264 and Opus/AAC;
- optional mobile third-person download: 15 MiB;
- mobile slice: 80 draw calls, 220 MiB runtime memory, stable 30fps.

Do not weaken these limits to make an asset pass. Optimize or request a measured
exception with Edge runtime evidence.

## Character contract

The final Echo/Yuki production rigs are not yet complete. Required baseline:

- one armature, no more than 128 bones;
- Idle, Walk, Run, and Interact clips with runtime-resolvable names;
- optional Turn, Look, PointHelp, Talk, and Celebrate clips;
- direct-skin identifier decal as a replaceable mesh/material layer;
- Echo uses `EX-011`; Zero corruption is a separate animated mask/material;
- mobile LODs and texture variants;
- GLB re-import and browser animation verification before publication.

## Connected creative applications

Canva, Figma, image generation, Magnific, HeyGen, and music/video applications
may support moodboards, concepts, storyboards, upscale tests, and previs.
Nothing becomes a production asset until its rights, source, Canon continuity,
performance budget, accessible fallback, and gameplay integration are recorded.
No voice or music from another anime may be copied.

Local ComfyUI/Stable Diffusion is intentionally deferred on the current 8GB
Intel-UHD machine. Audacity is deferred until approved VO/SFX exists.

## Handoff when the Manhwa is final

1. Attach the full ordered pages and final Arabic text separately.
2. Assign a publication version and file hashes.
3. Resolve page-level identities, chronology, tattoo visibility, and Zero reveal.
4. Create bilingual transcripts and visual descriptions outside the artwork.
5. Map each puzzle to a specific shown clue; remove stale puzzles.
6. Storyboard only the cinematic moments that gain value from motion.
7. Lock Echo/Yuki turnarounds before final sculpt, rig, or facial blendshapes.
8. Produce one 10–15 minute hybrid slice before expanding the world.
