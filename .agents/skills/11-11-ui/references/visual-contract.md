# 11.11 Visual Contract Reference

## Prompt scaffold

```text
Use case: stylized-concept
Asset type: 11.11 <surface> visual contract, decorative background only
Primary request: Create an original cinematic atmosphere for <surface>.
Input images: supplied images are mood references only; do not copy their composition or text.
Scene/backdrop: <environment and focal depth>
Subject: <symbolic objects only; no Canon character unless approved source exists>
Style/medium: premium dark fantasy game key art, art-directed 3D illustration
Composition/framing: <viewport ratio>; protect empty space for the live UI at <placement>
Lighting/mood: low-key obsidian with measured crimson signal light and warm ivory highlights
Color palette: charcoal, blackened steel, signal crimson, muted ember, pale ivory
Materials/textures: engraved metal, black stone, restrained glass reflections, subtle atmospheric particles
Text (verbatim): ""
Constraints: original composition; decorative only; no readable words, numbers, logo, watermark, UI widgets, or people unless explicitly approved
Avoid: copied reference layout, royalty/crown imagery unless the surface needs it, gore, visual clutter, harsh strobing, advertisements, loot boxes
```

## Surface choices

- **Chess:** use a high-angle altar-like board, quiet red signal channels, asymmetric ritual geometry, and space around the center board. Do not paint pieces that can be mistaken for live board state.
- **Puzzles:** use memory fragments, archive glass, routing lines, or tactile mechanisms. Keep the puzzle workspace calm and obvious.
- **Story/Manhwa:** use Canon-approved environments only; do not invent character facts.
- **Hub/community:** use signal architecture, private channels, and Echo motifs; keep social safety and moderation controls prominent.
- **Icon concept:** use one isolated symbolic object with strong silhouette and no text on a flat, neutral visual field. Then implement the actual icon in the native registry.

## UI translation rules

- Build labels, numbers, timers, tooltips, controls, and state in HTML/CSS/React.
- Use the image as a bounded, lazy decorative layer with a CSS fallback.
- Place at least one non-color state signifier beside red/black/cyan state colors.
- Give primary actions a visible label and focus ring; do not hide them inside art.
- Prefer `prefers-reduced-motion` and project motion settings for effects.
