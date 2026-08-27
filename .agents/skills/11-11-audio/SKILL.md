---
name: 11-11-audio
description: Design, review, fix, or extend any 11.11 audio surface: SFX, synthesized reward tones, Echo Mind signals, cinematic audio cues, audio accessibility, mute/volume behavior, or audio asset pipelines. Use before adding any player-facing sound; enforce non-blocking audio, reduced-motion equivalents, and visual-first accessibility. Do not modify frozen game logic, puzzle canon, or cinematic scenes unless the task explicitly scopes audio-only changes within allowed boundaries.
---

# 11.11 Audio Skill

11.11 uses synthesized Web Audio API sounds rather than sample libraries. Audio is optional, non-blocking, and subordinate to the visual presentation. Every audio cue must have a visual equivalent so mute players retain full information.

## Active implementation facts

- **Reward audio:** `src/infrastructure/audio/puzzleRewardAudio.ts` defines `RewardSoundTier` (`puzzle`, `standard`, `rare`, `system`) and exports `playPuzzleCompletionSound(volume)` and `playAchievementUnlockSound(tier, volume)`. It uses a shared `AudioContext` with clamped volume, lowpass filtering, exponential ramps, and timeout-based node cleanup.
- **Echo Mind audio:** `src/infrastructure/audio/echoMindSignalAudio.ts` exports `playEchoMindSignal(tone, volume)`. Tones are `signal`, `memory`, `warning`, and `reply`. Volume is capped at `0.16 * inputVolume`.
- **Volume source:** `src/app/shell/shellStore.ts` exposes `sfxVolume` (default `0.7`, clamped `0..1`) via `setSfxVolume`. Screens read it through `useUiPreferencesStore`.
- **Settings surface:** `src/features/screens/SettingsScreen.tsx` exposes `sfxIntensity` as a localized preference control.
- **Callers:**
  - `PuzzleScreen.tsx` — `playPuzzleCompletionSound(sfxVolume)` after receipt.
  - `LiveChallengesScreen.tsx` — `playAchievementUnlockSound(tier, sfxVolume)` or `playPuzzleCompletionSound(sfxVolume)`.
  - `AchievementPresentationOverlay.tsx` — `playAchievementUnlockSound(current.tier, sfxVolume)`.
  - `ExperienceCueAudioBridge.tsx` — `playEchoMindSignal(signal, sfxVolume * 0.72)`.
  - `AwakeningWardScreen.tsx` — `playFeedback(frequency, duration, sfxVolume)` via synthesized oscillator.
- **Cinematic audio schema:** `data/schemas/cinematic-assets.schema.json` allows `audio/ogg` and `audio/mp4`; `data/schemas/cinematic-episode.schema.json` defines `audioCue` with channel `music | ambience | sfx` and kind `audio`.
- **No external audio library:** The project does not depend on `howler`, `tone.js`, or similar. All runtime audio is synthesized via `window.AudioContext`.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the actual audio file (`puzzleRewardAudio.ts`, `echoMindSignalAudio.ts`, `AwakeningWardScreen.tsx`) before changing behavior.
3. Preserve non-blocking audio: every audio function must swallow errors and never block gameplay, reward receipt, or Echo Mind state updates.
4. Preserve mute and accessibility: if `audioEnabled` is false or volume is zero, no sound plays. Visual equivalents must exist for every audio cue.
5. Reuse the existing `AudioContext` pattern. Do not create per-call `new AudioContext()` unless the call is short-lived and explicitly closed (as in `echoMindSignalAudio.ts`).
6. Preserve volume scaling: `sfxVolume` is the master; `ExperienceCueAudioBridge.tsx` uses `sfxVolume * 0.72`; `echoMindSignalAudio.ts` caps at `0.16 * volume`.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Audio design rules

- Synthesized tones only. Do not introduce sample playback without a product directive.
- Frequencies and envelopes must be tested for headphone and mobile speaker legibility.
- Reward tones must be distinguishable by tier (`puzzle` is shorter and triangle-wave; `rare` and `system` are longer and higher-register).
- Warning tones use sawtooth; all others use sine.
- Cinematic audio cues are authored as data (`audioCue`), not hardcoded in components.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
