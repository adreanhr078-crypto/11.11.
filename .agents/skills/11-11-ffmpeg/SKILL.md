---
name: 11-11-ffmpeg
description: >-
  Encode, transcode, compress, and validate video assets for 11.11 cinematics
  using FFmpeg. Use for WebM/MP4 export from Blender, frame extraction,
  bitrate targeting, codec validation, and CI media checks. Do not modify game
  logic, puzzle canon, or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-ffmpeg
    license: project-internal
---

# 11.11 FFmpeg Skill

FFmpeg is the video encoding backbone for 11.11 cinematic assets. All encoded outputs must respect the size and quality budgets defined in the cinematic asset schema.

## Active implementation facts

- **Cinematic schema:** `data/schemas/cinematic-assets.schema.json` allows `audio/ogg` and `audio/mp4`.
- **Blender pipeline:** `.agents/skills/11-11-ui/references/blender-pipeline.md` and `.agents/skills/11-11-blender` define export targets.
- **Existing asset:** `public/assets/cinematics/echo-transform-base-to-black-coronation-v1.mp4` is ~8.37 MB.
- **Size budgets:**
  - Cinematic MP4 target: < 10 MB for lazy-loaded sequences.
  - UI/atlas video loops: < 5 MB.
- **Preferred codecs:**
  - WebM: VP9 + Opus audio.
  - MP4: H.264 + AAC audio (fallback only).

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read the cinematic asset schema and blender pipeline before encoding.
3. Encode with FFmpeg using the command patterns below.
4. Validate the output with `ffprobe` or ImageMagick before copying into `public/assets/`.
5. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## FFmpeg command patterns

### WebM from image sequence (VP9)

```bash
ffmpeg -y -framerate 24 -i frame_%04d.png \
  -c:v libvpx-vp9 -crf 30 -b:v 0 -deadline best \
  -c:a libopus -b:a 96k \
  output.webm
```

### MP4 from image sequence (H.264 fallback)

```bash
ffmpeg -y -framerate 24 -i frame_%04d.png \
  -c:v libx264 -preset slow -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  output.mp4
```

### Compress existing MP4 under 10 MB

```bash
ffmpeg -y -i input.mp4 \
  -c:v libx264 -preset slow -crf 24 \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  output.mp4
```

### Extract a poster frame

```bash
ffmpeg -y -ss 00:00:01.000 -i input.mp4 \
  -frames:v 1 -q:v 2 \
  poster.jpg
```

## CI validation

Add FFmpeg checks to `tools/media/validate-assets.ts` or a dedicated CI step:
- Verify codec with `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name`.
- Verify duration and bitrate.
- Reject files over size budget.

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
