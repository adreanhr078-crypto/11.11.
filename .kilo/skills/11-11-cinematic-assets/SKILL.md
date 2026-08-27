---
name: 11-11-cinematic-assets
description: >-
  Produce, review, or integrate cinematic assets for 11.11: Echo
  transformations, chapter transitions, rare-reward reveals, chess entrances,
  and puzzle-completion sequences. Covers Blender scene guidance, video/WebM
  encoding, sprite/GLB exports, lazy-loading patterns, fallback frames, and
  cinematic audio cue data. Read the active project rules and run preflight
  before any cinematic integration. Do not modify frozen game logic, puzzle
  canon, or reward authority.
metadata:
  category: game-development
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-cinematic-assets
    license: project-internal
---

# 11.11 Cinematic Assets Skill

Cinematic assets are authored outside the runtime and loaded lazily. The app ships one authored MP4 (`echo-transform-base-to-black-coronation-v1.mp4`, ~8.37 MB) and uses image sequences for other transformations. The cinematic data model lives in `data/schemas/cinematic-episode.schema.json` and `cinematic-assets.schema.json`.

## Active implementation facts

- **Blender pipeline:** `.agents/skills/11-11-ui/references/blender-pipeline.md` defines export choices (GLB for interactive 3D, WebM/MP4 for fixed sequences, texture/sprite layers for parallax).
- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md` defines palette (obsidian, signal crimson, pale ivory), materials, and prompt scaffold.
- **Schema:** `data/schemas/cinematic-episode.schema.json` defines `audioCue` with `kind: audio`, `channel: music | ambience | sfx`, `asset`, `startsAt`, `duration`. `data/schemas/cinematic-assets.schema.json` allows `audio/ogg` and `audio/mp4`.
- **Existing assets:** `public/assets/cinematics/echo-transform-base-to-black-coronation-v1.mp4` is the only authored MP4. Other transformations (`second_contract_marked`, `black_echo_protocol`) use image/frame sequences.
- **Lazy loading:** Blender outputs must be lazy-loaded behind player action, with reserved dimensions and CSS/image fallback.
- **Reduced motion:** Every cinematic must have a static poster/fallback frame that preserves the emotional read.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `blender-pipeline.md` and `visual-contract.md` before creating or integrating any cinematic asset.
3. Choose the lightest suitable export format: GLB for interactive, WebM for cinematic, sprites for parallax.
4. Store final exports under `public/assets/cinematics/` or `public/assets/ui/<surface>/` with stable versioned filenames.
5. Preserve accessibility: no readable text/logos in Blender output; all text is rendered in HTML.
6. Do not add ad slots to cinematics.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Free toolchain for cinematics

| Purpose | Free tool | Export format |
|---|---|---|
| 3D scene authoring | Blender (free, open-source) | GLB, WebM, PNG sequence |
| Image concept/background | $imagegen (built-in) | PNG, WebP |
| Video encoding | FFmpeg (free, open-source) | WebM (VP9), MP4 (H.264) |
| Sprite atlas packing | TexturePacker (free tier) / ShoeBox | PNG, JSON |
| Audio SFX for cinematics | Web Audio API (built-in) / Audacity (free) | WAV, OGG |
| Subtitles | Aegisub (free) / built-in JSON | SRT, VTT, JSON |

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
