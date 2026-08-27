---description: Generate, validate, or transform media assets for the 11.11 project.---
# /asset — Asset Tasks

Generate, validate, or transform media assets: images, videos, audio, 3D models.

## Usage

/asset <task> [args] — where task is one of:
- `validate` — run `npm run media:validate`
- `image <prompt>` — generate image (ComfyUI/Canva/$imagegen)
- `3d <blend>` — export GLB from Blender
- `cinematic <blend>` — render cinematic
- `tts <text>` — generate voice line
- `check-env` — run `npm run env:check`
- `setup` — run `npm run env:setup`

## CLI tools

### Validation

```bash
npm run media:validate   # Validate all media assets
npm run env:check         # Check free media tools availability
npm run env:setup         # Create media-tools manifest
```

### Image generation

```bash
# Local Stable Diffusion via ComfyUI
COMFYUI_URL=http://127.0.0.1:8188 npx tsx tools/stable-diffusion/run-comfyui.ts -- \
  generate --prompt "obsidian chess board, signal crimson light" --output ./output.png

# Canva API
CANVA_API_KEY=xxx npx tsx tools/canva/run-canva.ts -- \
  create-design --title "11.11 Icon" --width 1024 --height 1024
```

### 3D / Cinematic

```bash
# Export GLB for Three.js
npx tsx tools/blender/run-blender.ts -- export-gltf \
  --blend ./scene.blend --output ./public/assets/ui/<surface>/model.glb

# Render cinematic PNG sequence
npx tsx tools/blender/run-blender.ts -- render-cinematic \
  --blend ./scene.blend --output-dir ./frames --start 1 --end 240 --fps 24
```

### Audio

```bash
# Generate TTS
ELEVENLABS_API_KEY=xxx npx tsx tools/ai-audio/run-tts.ts -- \
  generate --text "Hello Echo" --output ./output.mp3 --provider elevenlabs
```

## Asset budget

| Type | Budget |
|---|---|
| Cinematic MP4 | < 10 MB |
| UI image (WebP/PNG) | < 2.5 MB |
| Audio (OGG/MP3) | normalized -14 LUFS |

## Skills to load

- `$11-11-image-generation` — image generation pipeline
- `$11-11-cinematic-assets` — cinematic pipeline
- `$11-11-3d-pipeline` — full 3D pipeline
- `$11-11-ffmpeg` — video encoding
- `$11-11-imagemagick` — image processing
- `$11-11-stable-diffusion` — SD/ComfyUI
- `$11-11-canva-cli` — Canva API
- `$11-11-tts` — TTS
