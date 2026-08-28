# Echo Experiment Prologue — Visual Contract

Status: `STAGE 4.0B BLENDER FOUNDATION`

This directory contains project-bound cinematic keyframes. They are visual
references for the later Blender scene, not runtime assets. Nothing in this
directory is loaded by the application.

## Provenance

- The three keyframes were generated specifically for 11.11 with OpenAI's
  image-generation workflow on 2026-08-28.
- Character identity and clothing were guided only by project-owned Manhwa and
  character references. No frame, logo, voice, music, or character from an
  external anime or commercial game is included.
- The images are production references until the Owner approves the final
  Blender render; they are not authoritative Canon records or gameplay state.

## Canon lock

- Echo enters the experiment under deliberately ambiguous circumstances.
- Yuki is present behind the observation glass.
- Echo is `EX-011`; the identifier is a clearly readable tattoo on exposed
  neck skin, never a collar, garment, floating label, or authoritative state.
- Yuki is `EX-012`, but this prologue does not need to reveal the full mark.
- Character identity follows the project-owned Manhwa and character assets.
- The scene does not establish consent, coercion, an ending, or a reward.

## Visual design review

**Selected treatment:** Blender-authored fixed cinematic, exported as WebM
with MP4 fallback and a static WebP poster.

The scene has a fixed camera language and no player-controlled depth, so a GLB
or Unity runtime would add load and input complexity without improving the
moment. The current keyframes were produced as identity-preserving concept art
to lock composition before character modelling and animation.

**Language:** obsidian laboratory structure, blackened steel, restrained
signal-crimson activation, pale ivory memory light, muted violet around Yuki,
and minimal cyan restricted to scanner/signal behavior.

**Accessibility:** all subtitles, skip/mute controls, and first-objective copy
remain live HTML. The final render must include a static poster and a reduced-
motion storyboard alternative. No gameplay rule is carried only by the image.

**Loading:** first authenticated entry only, after an explicit player action.
Poster first; video lazy-loaded. Failure or low-power mode advances through the
same story with the poster/keyframes and live captions.

## Approved keyframes

1. `keyframe-01-entry-v1.png` — Echo enters; Yuki watches through glass.
2. `keyframe-02-tattoo-scan-v1.png` — exact `EX-011` skin tattoo close-up.
3. `keyframe-03-activation-v1.png` — activation and signal-to-P1 transition.

## Timing board

| Time | Shot | Player-facing purpose |
| --- | --- | --- |
| 00:00–00:06 | Sealed corridor and entry | Establish mystery without declaring force or consent. |
| 00:06–00:13 | Yuki behind observation glass | Establish an emotional witness and unanswered relationship. |
| 00:13–00:19 | Neck scan and `EX-011` tattoo | Establish Echo as a numbered experiment. |
| 00:19–00:29 | Chamber activation and memory fracture | Convert atmosphere into a playable signal problem. |
| 00:29–00:35 | Signal reaches camera/player | Transition directly to onboarding and Puzzle 1. |

## Final-production budgets

- 24 fps, 30–35 seconds.
- Mobile WebM target: <= 4 MB.
- Desktop WebM target: <= 7 MB.
- MP4 fallback target: <= 7 MB.
- Poster WebP target: <= 250 KB.
- No readable UI, subtitle, timer, reward, or player data inside the render.
- No continuous motion after the cinematic exits.

## Tooling status

- Blender 5.2.1 LTS x64 is available outside `WindowsApps` through the
  task-specific `BLENDER_EXE` contract.
- Headless startup, Python 3.13.13, deterministic `.blend` creation, and three
  proof-frame renders are locally verified.
- The editable scene is generated at
  `art/blender/source/echo-experiment-prologue-v1.blend` from
  `art/blender/scripts/build_echo_experiment_prologue.py`.
- FFmpeg 9.0.1 is locally verified: the 1280x720 RGB proof frame was inspected
  with `ffprobe`, and a 1280x720 YUV420P WebP poster encoded to 63,112 bytes.
- ImageMagick remains unavailable because its required Visual C++ runtime UAC
  install was declined. Final frame validation must not claim ImageMagick
  evidence until that prerequisite is approved.
- Final character rigging, final audio, WebM/MP4 budgets, and runtime
  integration remain unverified. The current scene is a 2.5D animatic
  foundation, not the final published asset.

## Deterministic build

```powershell
npx tsx tools/blender/run-blender.ts doctor
npx tsx tools/blender/run-blender.ts run-python `
  --script art/blender/scripts/build_echo_experiment_prologue.py `
  -- `
  --reference-dir art/blender/reference/echo-experiment-prologue `
  --output art/blender/source/echo-experiment-prologue-v1.blend `
  --preview-dir .tmp/blender/echo-experiment-prologue
```
