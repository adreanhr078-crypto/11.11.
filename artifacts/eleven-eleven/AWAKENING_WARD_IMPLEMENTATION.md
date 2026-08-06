# Awakening Ward — A-01

## Scope

This vertical slice adds one mobile-first 2.5D isometric zone. It does not add
multiplayer, a leaderboard, enemies, combat, or a second world zone. The
existing Firebase authentication, player API, 20-puzzle archive, save IDs, and
3D opening-room prototype remain intact.

## Runtime Structure

- React owns HUD, touch controls, inventory, clue log, and puzzle overlays.
- Phaser owns the isometric scene, camera, depth ordering, movement, collision,
  occlusion, interaction proximity, adaptive quality, and runtime metrics.
- `awakeningWardMap.ts` owns geometry, objects, checkpoints, and interactions.
- `awakeningWardState.ts` owns ordered progression, inventory, save repair, and
  item/clue catalogs.
- `roomPuzzleRegistry.ts` keeps room puzzles independent from the unchanged
  legacy puzzle records and save IDs.
- `wardNavigation.ts` is rendering-independent and verifies boundaries,
  collision, corridor clearance, reachability, and camera zoom.

## Ordered Progression

1. Inspect the 11:11 clock.
2. Route power through a rotatable circuit grid.
3. Align the three monitor channels.
4. Read and explicitly record the reflected symbol sequence.
5. enter the symbols on the hidden drawer keypad.
6. explicitly collect Keycard A-07.
7. use the card at the A-07 reader.

The save normalizer removes impossible downstream flags and removes a keycard
that is not backed by an opened drawer. Completion cannot survive without the
full sequence and the keycard.

## Placeholder Asset Manifest

### Generated, replaceable WebP textures

- `public/assets/awakening-ward/ward-floor-placeholder.webp` — 512x512,
  13 KB, original modular gunmetal floor texture.
- `public/assets/awakening-ward/ward-wall-placeholder.webp` — 512x512,
  8 KB, original modular graphite wall texture.

Both were generated as original seamless albedo placeholders, then resized and
compressed to WebP. Neither is cropped or derived from either reference image.

### Code-drawn placeholders

- Neutral player silhouette, idle/walk/run motion only; this is not Echo.
- Awakening capsule and floor pad.
- Medical console and side table.
- Power panel, cables, and routed floor power line.
- Monitor wall, console screens, and chair.
- Wall mirror, storage cabinet, and moving drawer.
- Crate, corridor guide lights, A-07 reader, and moving exit door.
- Interaction markers, emergency wash, fog, scanlines, and screen flicker.

## Final Art Still Needed

- Authored isometric player sprite sheet with eight-direction idle/walk/run.
- Final capsule, medical props, power panel, monitor bank, mirror/storage, and
  A-07 door sprite sets with normal and powered states.
- Purpose-built floor/wall tile set with edge, corner, damage, cable, and decal
  variants.
- Authored UI glyphs for the circuit, monitor, mirror, keypad, inventory, and
  keycard.
- Final low-volume room ambience and interaction SFX.
- Optional optimized light maps and wall-occlusion masks per authored tile.

## Visual Reference Comparison

The implementation follows the references in composition: a central capsule,
clock and power on the left/back wall, monitoring above the chamber, mirror and
storage at the corridor threshold, and a broad guided route to A-07. It also
uses the requested charcoal metal, warning red, limited cyan, light fog, damaged
systems, and restrained flicker.

The implementation deliberately differs where production safety matters: the
references are not used as backgrounds, no elements are cropped from them, the
corridor is wider and unobstructed, every object is data-addressable, and all
visuals are replaceable without changing puzzle or save logic.

## Visual QA Routes

Development-only query parameters can open each overlay without changing saved
progress:

- `?wardPuzzle=ward_power_circuit#/awakening-ward`
- `?wardPuzzle=ward_monitor_tuning#/awakening-ward`
- `?wardPuzzle=ward_mirror_observation#/awakening-ward`
- `?wardPuzzle=ward_drawer_keypad#/awakening-ward`
- Add `telemetry=1` to display FPS, active quality, and scene load time.

## Feature Flags

- `OPENING_ROOM_3D_ENABLED=false` keeps the prior 3D prototype independent.
- `VITE_LEGACY_PUZZLE_ARCHIVE_ENABLED=false` hides the old puzzle UI from the
  primary flow while retaining all 20 records and their save IDs.
