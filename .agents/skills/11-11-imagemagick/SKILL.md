---
name: 11-11-imagemagick
description: >-
  Validate, convert, compress, and process image assets for 11.11 using
  ImageMagick. Use for WebP compression, alpha verification, format conversion,
  atlas inspection, poster frame extraction, and CI asset validation. Do not
  modify game logic, puzzle canon, or frozen systems.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-imagemagick
    license: project-internal
---

# 11.11 ImageMagick Skill

ImageMagick is the image processing backbone for 11.11 asset pipelines. Every image entering `public/assets/` must pass ImageMagick validation.

## Active implementation facts

- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md` defines palette and format requirements.
- **Blender pipeline:** `.agents/skills/11-11-ui/references/blender-pipeline.md` and `.agents/skills/11-11-blender` define export targets.
- **Asset destinations:** `public/assets/ui/<surface>/`, `public/assets/cinematics/`, `public/assets/awakening-ward/`.
- **Formats:**
  - WebP for game sprites and atlases (preferred for size).
  - PNG for alpha-critical assets (UI overlays, cinematic posters).
  - JPG only for non-alpha backgrounds where size is critical.

## ImageMagick command patterns

### Verify alpha channel

```bash
magick identify -format "%[channels] %[alpha] %[fx:mean]\\n" input.png
```

### Convert PNG to WebP (lossless)

```bash
magick input.png -define webp:lossless=true -quality 90 output.webp
```

### Compress WebP under size budget

```bash
magick input.webp -quality 80 -define webp:method=6 output.webp
```

### Extract poster frame from video

```bash
magick input.mp4[1] poster.png
```

### Check for near-black fringe (alpha issue)

```bash
magick input.png -fuzz 10% -fill none -draw "color 0,0 floodfill" -alpha extract fringe.png
```

## CI validation

Add ImageMagick checks to `tools/media/validate-assets.ts`:
- Verify format with `magick identify -format "%m"`.
- Verify alpha with `magick identify -format "%A"` (True/False).
- Reject images over size budget.
- Reject images with suspicious metadata (text chunks, profiles).

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
