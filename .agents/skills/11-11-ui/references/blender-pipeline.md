# 11.11 Blender Visual Pipeline

Use this reference after the Visual Design Review selects a Blender-relevant treatment.

## Choose the export

- Use **GLB/GLTF** for a small, player-controlled 3D scene that adds genuine interaction.
- Use **WebM** first (and MP4 only where needed) for a fixed cinematic such as an entrance, transformation, or rare-reward reveal.
- Use **texture/sprite layers** for camera parallax, particles, and premium depth that do not need live geometry.
- Do not render readable UI text, timer values, rules, player identity, or reward authority into Blender output; React owns those accessible states.

## Scene checklist

1. Block a single clear focal moment that supports the game state.
2. Use a deliberate camera path, restrained signal-crimson lighting, readable silhouette, and atmosphere that does not obscure play.
3. Animate particles and effects only where they communicate a transition, transformation, consequence, or reward.
4. Render a static poster/fallback frame before the sequence. It must preserve the emotional read under reduced motion, mute, failure, or low-power conditions.
5. Optimize geometry, materials, texture resolution, duration, and encoding before copying an export into `public/assets/ui/<surface>/`.
6. Lazy-load the visual only after the player chooses the surface; reserve dimensions and supply a CSS or image fallback.

## Acceptance evidence

- Inspect the exported asset for framing, clipping, alpha/codec compatibility, and accidental text/logos.
- Test desktop landscape, touch portrait/landscape, Arabic RTL and English LTR controls around it, keyboard focus, mute, reduced motion, slow loading, and missing-asset fallback.
- Capture actual browser performance evidence before calling the visual treatment complete. A beautiful asset that delays chess moves, puzzle input, or first interaction fails review.
