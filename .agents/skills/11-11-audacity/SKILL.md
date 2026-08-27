---
name: 11-11-audacity
description: >-
  Edit, clean, normalize, and export audio assets for 11.11 using Audacity.
  Use for SFX cleanup, noise reduction, format conversion (WAV/OGG/MP3),
  loudness normalization, and batch export of synthesized audio. Do not modify
  game logic, puzzle canon, or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-audacity
    license: project-internal
---

# 11.11 Audacity Skill

Audacity is used for offline audio processing of 11.11 sound assets. The runtime prefers synthesized Web Audio API, but authored SFX and ambience are processed through Audacity before integration.

## Active implementation facts

- **Reward audio:** `src/infrastructure/audio/puzzleRewardAudio.ts` synthesizes tones; no external samples are played at runtime.
- **Echo Mind audio:** `src/infrastructure/audio/echoMindSignalAudio.ts` synthesizes signals; no external samples.
- **Awakening Ward:** `AwakeningWardScreen.tsx` uses synthesized `playFeedback`; ambient/room SFX are still authored assets.
- **Cinematic audio schema:** `data/schemas/cinematic-episode.schema.json` defines `audioCue` with `channel: music | ambience | sfx` and `kind: audio`. These cues reference assets that must be processed and validated.

## Audio processing rules

- **Loudness:** Normalize to -14 LUFS integrated. Peak-limit to -1 dBTP.
- **Formats:**
  - WAV for archival/master.
  - OGG (Vorbis) for web delivery.
  - MP3 only as fallback where OGG is not supported.
- **Naming:** Use stable versioned filenames under `public/assets/audio/` or surface-specific folders.
- **Accessibility:** Every authored audio asset must have a visual equivalent in the UI.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the target screen and audio schema before processing assets.
3. Process audio in Audacity: cleanup, normalize, export.
4. Validate the output with a loudness meter or FFmpeg before integration.
5. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## Batch processing in Audacity

- Use **Macros** for repetitive tasks: noise removal, normalize, export.
- Use **Chains** via `mod-script-pipe` for headless batch processing in CI.
- Use **Nyquist** plugins for custom loudness limiting if needed.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
