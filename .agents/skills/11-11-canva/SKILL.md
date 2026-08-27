---
name: 11-11-canva
description: >-
  Create graphic assets for 11.11 using Canva: social media visuals, icon
  concept sheets, marketing materials, event banners, and visual-contract
  reference boards. Use Canva's free tier or approved API for rapid
  prototyping. Enforce the 11.11 visual contract (obsidian palette, no
  readable text in generated images, decorative-only outputs). Do not modify
  frozen game logic.
metadata:
  category: tooling
  source:
    repository: 'https://github.com/your-org/Futuristic-Eleven-Eleven'
    path: .agents/skills/11-11-canva
    license: project-internal
---

# 11.11 Canva Skill

Canva is used for 2D graphic design and marketing assets. Gameplay surfaces
must still follow the visual contract and accessibility rules.

## Active implementation facts

- **Visual contract:** `.agents/skills/11-11-ui/references/visual-contract.md`
  defines palette (obsidian/charcoal, signal crimson, pale ivory).
- **Asset storage:** Final approved images go under `public/assets/ui/<surface>/`
  or `public/assets/marketing/`.
- **Canva API:** Use Canva's official API for programmatic asset generation.
  Free tier supports basic operations.
- **Canva Apps SDK:** Use for in-app design workflows when approved.

## Required workflow

1. Run `npm run agent:preflight` before any edit. Stop on failure.
2. Read `visual-contract.md` before creating any Canva asset.
3. Create or export assets from Canva in PNG/WebP/PDF.
4. Inspect for readable text, logos, or copied reference layouts before use.
5. Store approved assets with stable versioned filenames.
6. Run `npm run agent:postflight` after integration. If it fails, do not declare success.

## Canva integration patterns

- **API:** `POST /v1/designs` for programmatic generation.
- **Export:** PNG, WebP, PDF (vector), MP4 (animation).
- **Brand kit:** Store 11.11 palette in Canva Brand Kit for consistency.
- **Templates:** Create reusable templates for common surfaces (icons, banners).

## What is frozen and must not change

- Canon puzzle logic, story endings, Memory Shards counts.
- Achievement registry and cinematic scene authority.
- Reward authority or duplicate-request replay rules.
