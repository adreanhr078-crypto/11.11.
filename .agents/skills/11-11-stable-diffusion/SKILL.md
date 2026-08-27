---
name: 11-11-stable-diffusion
description: >-
  Generate AI images locally using Stable Diffusion or ComfyUI for 11.11
  concept art, mood plates, icon concepts, and visual contracts. Use when
  the project needs offline image generation without paid cloud services.
  Covers model selection, prompt engineering for the 11.11 visual contract,
  batch generation, and output validation. Do not modify frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-stable-diffusion
    license: project-internal
---

# 11.11 Stable Diffusion Skill

Stable Diffusion is the local AI image generation backbone for 11.11. All
generated images are decorative and must pass the visual contract validation.

## Active implementation facts

- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md`
  defines palette (obsidian/charcoal, signal crimson, pale ivory).
- **Built-in generator:** `$imagegen` is the project-bound raster tool.
  Stable Diffusion is used for higher-fidelity concept art.
- **Asset storage:** Final approved images go under `public/assets/ui/<surface>/`.
- **Tools:**
  - **ComfyUI** (recommended) — node-based workflow, easy batch generation.
  - **Automatic1111** — classic web UI, good for rapid prototyping.
  - **Fooocus** — simplified UI, good for consistent style.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `visual-contract.md` before generating any image.
3. Prepare prompts using the visual contract scaffold.
4. Generate images with Stable Diffusion/ComfyUI locally.
5. Validate outputs: no readable text, no logos, palette compliance, alpha correct.
6. Store approved images under `public/assets/ui/<surface>/`.
7. Run `npm run agent:postflight` after changes. If it fails, do not declare success.

## Prompt scaffold

```
11.11 visual contract:
- Palette: obsidian, signal crimson, pale ivory
- Style: premium dark fantasy game key art
- Surface: <chess board / puzzle workspace / hub / transformation>
- Constraints: decorative only, no readable text, no logos, no UI widgets
- Mood: low-key, restrained particles, readable silhouette
```

## Model recommendations

| Model | Use case | Notes |
|---|---|---|
| SDXL + 11.11 LoRA | Concept art | Requires custom LoRA trained on visual contract |
| SD 1.5 + ControlNet | Precise composition | Good for icon concepts with pose control |
| ComfyUI workflows | Batch generation | Use for generating surface variants |

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
