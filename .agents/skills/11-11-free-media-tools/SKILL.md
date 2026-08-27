---
name: 11-11-free-media-tools
description: >-
  Integrate free, open-source external tools for 11.11 media production:
  image generation, audio synthesis, video encoding, 3D rendering, and asset
  pipeline automation. Use when the project needs to create or process images,
  sounds, videos, or 3D assets without paid services. Covers command-line
  invocations, asset validation, format conversion, and CI-friendly scripts.
  Do not modify game logic, puzzle canon, or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-free-media-tools
    license: project-internal
---

# 11.11 Free Media Tools Skill

All 11.11 media production should prefer free, open-source, locally runnable tools. Paid cloud services are acceptable only when no free alternative meets the quality bar and the cost is explicitly approved.

## Approved free toolchain

| Domain | Tool | License | Typical use in 11.11 |
|---|---|---|---|
| 3D modeling & rendering | Blender | GPL | Chess board entrances, Echo transformations, ward environments, props |
| Image generation | Stable Diffusion (local) / ComfyUI | Various | Concept art, icon concepts, background mood plates |
| Image processing | ImageMagick | Apache-2.0 | Format conversion, WebP compression, atlas packing, alpha verification |
| Video encoding | FFmpeg | LGPL/GPL | WebM/MP4 export from Blender, compression, frame extraction |
| Audio editing | Audacity | GPL | SFX cleanup, noise reduction, format conversion |
| Audio synthesis | Web Audio API (browser) | Built-in | Reward tones, Echo Mind signals, puzzle SFX |
| Sprite/atlas tools | ShoeBox (free) / TexturePacker free | Various | 2.5D sprite atlases, isometric tiles |
| Fonts | Google Fonts (free tier) / system fonts | Various | UI typography |
| Concept prompting | $imagegen (built-in) | Project tool | Visual contracts, icon concepts, mood references |

## Asset validation rules

- Every image/WebP must pass alpha verification before entering `public/assets/`.
- Every video must be under the size budget for its surface (cinematic MP4 target: < 10 MB for lazy-loaded sequences).
- Every audio asset must be normalized to -14 LUFS and peak-limited to -1 dBTP before integration.
- No asset may contain readable text, logos, watermarks, or third-party trademarks unless explicitly approved.

## CI integration

- Add media validation scripts under `tools/media/` (create if missing).
- Run validation in `npm run validate:content` or a new `npm run validate:media` script.
- Do not commit generated assets larger than 10 MB without explicit approval.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
