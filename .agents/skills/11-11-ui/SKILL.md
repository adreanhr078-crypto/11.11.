---
name: 11-11-ui
description: Create, redesign, review, or extend any player-facing 11.11 screen, menu, list, HUD, navigation item, icon, visual panel, responsive layout, animation, or visual asset. Use before every new or materially redesigned 11.11 interface or icon; require a visual design review and original visual contract before implementation, choose React/2.5D/Blender deliberately, then produce accessible code-native UI and verify it in the real player journey.
---

# 11.11ui

Create a single cinematic, accessible visual language for 11.11. Treat a visual design review and an original visual contract as the first design artifacts for every new or materially redesigned player-facing interface, menu, list, HUD, icon, animation, transition, reward, or major interaction. Do not substitute art for usable UI controls.

## Required workflow

1. Read the active project rules and run the required preflight.
2. Inspect the actual route, rendering path, existing tokens, icon registry, assets, and tests before changing UI.
3. Perform and record a concise **Visual Design Review** before writing player-facing UI code. Choose one rendering level using player impact, cinematic value, visual consistency, mobile/desktop performance, and accessibility:
   - **React/CSS:** lightweight menus, lists, forms, readable HUDs, routine navigation, and responsive utility panels.
   - **2.5D layered assets:** thematic panels, puzzle workspaces, and atmospheric transitions that need depth without real-time 3D.
   - **Blender-rendered assets or sequence:** first impressions and emotionally important moments: Echo transformations, character introductions, chapter transitions, chess entrances, victory/defeat, rare rewards, season finales, main-menu atmosphere, and premium cinematic panels.
   - **Interactive GLB/GLTF + camera/VFX:** only when interaction benefits materially from real-time depth and a lazy-loaded scene can meet target performance.
   - State the choice, why lighter/heavier options were rejected, loading strategy, fallback, and reduced-motion behavior in the implementation note or pull-request summary.
4. For a Blender-relevant moment, read [references/blender-pipeline.md](references/blender-pipeline.md), create or prepare the 3D scene with intentional camera, lighting, atmosphere, particles, and animation, then export the lightest suitable asset. Keep Blender source files and renders out of the critical application path until they are optimized and inspected.
5. Create an original visual contract **before writing player-facing UI code**:
   - Use `$imagegen` for a project-bound raster concept/background or an icon concept sheet.
   - Save the selected final asset under `artifacts/eleven-eleven/public/assets/ui/<surface>/` with a stable versioned filename.
   - Inspect the generated result before using it.
   - Use supplied references only as mood, palette, and atmosphere guidance. Do not copy their layout, typography, characters, trademarks, or embedded text.
   - Request no readable text or logos in generated assets; render all functional text in HTML so it remains localized and accessible.
6. Translate the approved visual contract into code-native controls, layout, typography, focus states, and motion. Keep generated art decorative or atmospheric; never make it the only carrier of a label, state, rule, or action.
7. Reuse existing 11.11 components and icons when they fit. For every genuinely new icon, generate and inspect an original icon concept image first, then implement the final icon in the repository's native icon system with an accessible label.
8. Verify the real screen at desktop landscape and touch portrait/landscape, Arabic RTL and English LTR when the surface is localized, keyboard focus, reduced motion, loading/empty/error states, and narrow widths.
9. Review every visual system as Game Director, UI/UX Director, Cinematic Director, and Performance Engineer. If it would not feel like a premium manhwa/anime game, improve it before completion.
10. Complete `$11.11-autonomous-quality-gate`; do not claim visual PASS without actual browser/runtime evidence.

## Visual contract standard

Read [references/visual-contract.md](references/visual-contract.md) before generating the image or choosing colors.

Every visual contract must provide:

- A clear focal area and protected negative space for accessible interactive controls.
- Obsidian/charcoal structure, restrained signal-crimson energy, pale ivory information hierarchy, and a secondary non-color cue for all state.
- Material depth through stone, glass, engraved metal, signal lines, or subtle grain—not dense visual noise.
- A distinct identity for the feature while remaining recognizably part of 11.11.
- No countdown pressure, loot-box imagery, fake scarcity, combat gore, watermarks, third-party logos, or advertisements in gameplay surfaces.

## Implementation guardrails

- Preserve Canon, reward authority, authentication, and existing gameplay behavior.
- Use semantic HTML, visible focus, minimum touch targets, textual state labels, and contrast that does not rely on red/black alone.
- Respect mute, reduced motion, and player control. Prefer brief purposeful transitions over perpetual animation.
- Keep gameplay legible first: a chessboard, puzzle grid, timer, moves, and actions must not compete with decorative art.
- Load large art lazily, reserve its dimensions to avoid layout shift, and provide a CSS gradient/solid fallback.
- Never add real-time 3D merely as decoration. Lazy-load GLB, Three/Fiber, video, or particle systems behind the player action that requests them; keep normal menus and gameplay responsive without those payloads.
- For Blender outputs, retain the smallest suitable export (GLB/GLTF for interaction, WebM/MP4 for authored sequences, optimized textures/sprites for 2.5D). Test the non-3D fallback, muted video behavior, and reduced-motion alternative.
- Do not add an ad slot to chess, puzzles, co-op, story, or cinematics. The product uses contextual ads only in the approved network hub/community placements.
- Do not create a parallel design system. Extend existing tokens/components only when they do not weaken the local surface.

## Review checklist

- The visual asset is original, versioned, project-bound, inspected, and used without making text/state inaccessible.
- The UI communicates its purpose in the first viewport and has a clear primary action.
- Controls remain reachable and labels remain readable at target viewport sizes.
- Color-independent markers distinguish sides, warnings, selection, and disabled states.
- Motion has a Reduced Motion alternative and does not delay input.
- The Visual Design Review selects an intentional rendering level, loading path, fallback, and avoids visual weight that has no player value.
- Blender scenes have inspected camera, lighting, particles, atmosphere, and optimized exports; normal menus do not inherit their payload.
- RTL/LTR, keyboard, touch, error, empty, loading, offline, and permission-denied states are intentional.
- Generated files, screenshots, logs, and caches are not staged accidentally.

## Prompt handoff

For each visual contract, use the structured prompt in [references/visual-contract.md](references/visual-contract.md). State the intended UI surface, required negative space, palette, materials, avoid list, and that the supplied images are mood references only.
