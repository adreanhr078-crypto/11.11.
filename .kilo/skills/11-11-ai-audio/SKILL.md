---
name: 11-11-ai-audio
description: >-
  Generate or synthesize speech, music, and ambient audio for 11.11 using
  free or approved AI audio tools. Use for Echo voice lines, cinematic
  narration, ambient soundscapes, and SFX prototyping. Enforce visual
  accessibility equivalents and non-blocking audio. Do not modify frozen game
  logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .kilo/skills/11-11-ai-audio
    license: project-internal
---

# 11.11 AI Audio Skill

AI audio tools are used for offline generation of Echo voice lines,
cinematic ambience, and music prototypes. Runtime audio is synthesized via
Web Audio API; generated assets are processed through Audacity before
integration.

## Active implementation facts

- **Reward audio:** `src/infrastructure/audio/puzzleRewardAudio.ts` — synthesized.
- **Echo Mind audio:** `src/infrastructure/audio/echoMindSignalAudio.ts` — synthesized.
- **Awakening Ward:** `AwakeningWardScreen.tsx` — synthesized feedback + room SFX assets.
- **Cinematic audio schema:** `data/schemas/cinematic-episode.schema.json` — `audioCue`
  with `channel: music | ambience | sfx`.

## Approved AI audio tools

| Tool | Use case | Notes |
|---|---|---|
| ElevenLabs free tier | Echo voice synthesis | Check terms for commercial use |
| Coqui TTS (local) | Offline voice generation | Open-source, requires GPU |
| Stable Audio (free tier) | Music and ambience | Browser-based, requires account |
| RVC (local) | Voice conversion/cloning | Open-source, requires GPU |
| Audacity + built-in effects | SFX processing | Free, offline |

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the target screen and audio schema before generating assets.
3. Generate audio with the approved AI tool.
4. Process in Audacity: cleanup, normalize (-14 LUFS), peak-limit (-1 dBTP).
5. Validate loudness with FFmpeg or Audacity before integration.
6. Store approved assets under `public/assets/audio/` or surface-specific folders.
7. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## Voice generation rules

- Echo voice must match the established character tone (childlike, digital, emotional).
- Generate multiple takes and select the best fit.
- Always provide a visual equivalent for audio cues (text notice, visual flash).

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
