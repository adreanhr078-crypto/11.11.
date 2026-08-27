---
name: 11-11-image-generation
description: >-
  Generate, review, or integrate images for 11.11 using free AI image
  generation tools. Covers visual contracts, icon concepts, background mood
  plates, cinematic key frames, sprite references, and asset validation. Use
  before adding any generated image to the project. Enforce the 11.11 visual
  contract (obsidian palette, no readable text, decorative-only outputs) and
  verify every asset before integration. Do not modify game logic or frozen
  systems.
metadata:
  category: game-development
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-image-generation
    license: project-internal
---

# 11.11 Image Generation Skill

11.11 uses AI-generated images for visual contracts, concept art, and atmospheric backgrounds. All generated images are decorative; no readable text, logos, or UI state is rendered into images.

## Active implementation facts

- **Built-in generator:** `$imagegen` is the project-bound raster generation tool. Use it for visual contracts and icon concepts.
- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md` defines palette (obsidian/charcoal, signal crimson, pale ivory), materials, and prompt scaffold.
- **Asset storage:** Final approved images go under `public/assets/ui/<surface>/` with stable versioned filenames.
- **Validation:** Every generated image must be inspected for framing, clipping, accidental text/logos, and alpha before use.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `visual-contract.md` and `blender-pipeline.md` before generating any image.
3. Use `$imagegen` with the structured prompt scaffold from `visual-contract.md`. State the surface, negative space, palette, materials, and avoid list.
4. Inspect the generated result before using it. Do not use an image that contains readable text, logos, or copied reference layout.
5. Store the approved image under `public/assets/ui/<surface>/` with a stable versioned filename.
6. Render all functional text in HTML so it remains localized and accessible.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Free image generation tools

| Tool | Use case | Notes |
|---|---|---|
| $imagegen (built-in) | Visual contracts, icon concepts | Project-bound, inspect output before use |
| Stable Diffusion (local) | Concept art, mood plates | Requires GPU; use ComfyUI for workflow |
| DALL-E / Midjourney free tier | Rapid prototyping | Check terms for commercial use |
| Leonardo / Playground free | Alternative rapid prototyping | Validate output for 11.11 palette compliance |

## Image validation checklist

- [ ] No readable text, numbers, or logos
- [ ] No copied reference composition
- [ ] Palette matches obsidian/crimson/ivory contract
- [ ] Alpha channel correct (no black fringe)
- [ ] Dimensions match target viewport ratio
- [ ] File size under budget for lazy-loaded assets
- [ ] CSS fallback defined

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
