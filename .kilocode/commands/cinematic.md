---description: Create or review cinematic assets for the 11.11 project.---
# /cinematic — Cinematic Asset Tasks

Create or review cinematic sequences: Echo transformations, chapter transitions, rare rewards.

## Usage

/cinematic <task> — where task is one of:
- `blend <file>` — process a Blender file
- `render <scene>` — render cinematic from Blender
- `export-gltf <blend> <output>` — export GLB from Blender
- `review` — review cinematic pipeline
- `list` — list existing cinematic assets

## CLI tools

```bash
# Render cinematic from Blender scene
npx tsx tools/blender/run-blender.ts -- render-cinematic \
  --blend ./scene.blend \
  --output-dir ./public/assets/cinematics/<name>/ \
  --start 1 --end 240 --fps 24

# Export GLB for Three.js
npx tsx tools/blender/run-blender.ts -- export-gltf \
  --blend ./scene.blend \
  --output ./public/assets/ui/<surface>/<name>.glb \
  --collection Main

# Encode PNG sequence to WebM
ffmpeg -y -framerate 24 -i frame_%04d.png \
  -c:v libvpx-vp9 -crf 30 -b:v 0 \
  -c:a libopus -b:a 96k \
  output.webm
```

## Existing assets

- `public/assets/cinematics/echo-transform-base-to-black-coronation-v1.mp4` (~8.37 MB)
- Other transformations use image sequences

## Schema

- `data/schemas/cinematic-episode.schema.json` — episodes with `audioCue`
- `data/schemas/cinematic-assets.schema.json` — allowed formats (audio/ogg, audio/mp4)

## Rules

1. Render poster/fallback frame for reduced motion.
2. WebM preferred; MP4 only where WebM unsupported.
3. No readable text in cinematic — render in HTML.
4. Lazy-load behind player action.
5. Reserve dimensions to avoid layout shift.
6. CSS gradient fallback required.

## Skills to load

- `$11-11-blender-cli` — Blender CLI invocations
- `$11-11-cinematic-assets` — cinematic pipeline
- `$11-11-3d-pipeline` — full 3D pipeline
- `$11-11-ffmpeg` — video encoding
