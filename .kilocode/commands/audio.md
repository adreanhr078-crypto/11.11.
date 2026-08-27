---description: Work on audio features and assets for the 11.11 project.---
# /audio — Audio Tasks

Work on audio: reward tones, Echo Mind signals, chess SFX, ambient music, voice lines.

## Usage

/audio <task> — where task is one of:
- `review` — review audio system
- `puzzle` — puzzle completion sound
- `achievement` — achievement unlock sound
- `echo-mind` — Echo Mind signal
- `tts <text>` — generate voice line via TTS
- `validate <file>` — validate audio asset
- `normalize <file>` — normalize audio loudness

## Active files

- `src/infrastructure/audio/puzzleRewardAudio.ts` — synthesized reward tones
- `src/infrastructure/audio/echoMindSignalAudio.ts` — synthesized Echo signals
- `src/app/shell/shellStore.ts` — `sfxVolume` preference
- `src/features/screens/SettingsScreen.tsx` — `sfxIntensity` setting

## Audio rules

- Synthesized tones (Web Audio API) for runtime feedback.
- Authored assets (Audacity-processed) for ambience, voice, music.
- Mute support: All audio functions check `audioEnabled` and volume.
- Visual equivalent required for every audio cue.
- Loudness: -14 LUFS integrated, peak-limit -1 dBTP.
- Volume scaling:
  - Master: `sfxVolume` (0..1, default 0.7)
  - Echo Mind: `sfxVolume * 0.72`
  - Echo signals: cap at `0.16 * volume`

## CLI tools

```bash
# Generate TTS via ElevenLabs
ELEVENLABS_API_KEY=xxx npx tsx tools/ai-audio/run-tts.ts -- \
  generate --text "Hello Echo" --output ./output.mp3 --provider elevenlabs

# Generate image via ComfyUI/Stable Diffusion
COMFYUI_URL=http://127.0.0.1:8188 npx tsx tools/stable-diffusion/run-comfyui.ts -- \
  generate --prompt "obsidian chess board" --output ./output.png

# Generate image via Canva
CANVA_API_KEY=xxx npx tsx tools/canva/run-canva.ts -- \
  create-design --title "11.11 Asset" --width 1024 --height 1024
```

## Skills to load

- `$11-11-audio` — audio system, reward tones, signals
- `$11-11-audacity` — audio processing
- `$11-11-ai-audio` — TTS generation
- `$11-11-tts` — TTS CLI
