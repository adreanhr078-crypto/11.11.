---
name: 11-11-tts
description: >-
  Invoke AI TTS services from the agent to generate voice lines, narration,
  and audio assets for 11.11. Use tools/ai-audio/run-tts.ts as the entry
  point. Supports multiple providers via environment variables. Do not modify
  frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-tts
    license: project-internal
---

# 11.11 TTS Skill

This skill provides the actual CLI interface for AI TTS operations that
the agent can invoke programmatically.

## Entry point

- `ELEVENLABS_API_KEY=xxx npx tsx tools/ai-audio/run-tts.ts -- generate --text "Hello Echo" --output ./output.mp3 --provider elevenlabs`

## Supported providers

| Provider | Env var | Notes |
|---|---|---|
| ElevenLabs | `ELEVENLABS_API_KEY` | Free tier available |
| Coqui TTS | `COQUI_API_KEY` | Local/open-source |
| Stable Audio | `STABLE_AUDIO_API_KEY` | Free tier available |

## Environment requirements

- Provider API key.
- Node.js 22+ for `npx tsx`.

## Error handling

- Exit code non-zero = TTS call failed. Capture stderr for diagnostics.
- 401 = invalid API key. 429 = rate limited.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
