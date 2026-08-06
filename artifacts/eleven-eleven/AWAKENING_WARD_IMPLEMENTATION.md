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

## Art Pass V2 Asset Manifest

Five original alpha WebP atlases live under
`public/assets/awakening-ward/art-pass-v2/`. Their combined size is about
793 KB. They are loaded only with Awakening Ward.

- `floor-atlas.webp` — four detailed isometric floor variants: access plate,
  vent, warning plate, and corridor guide light.
- `wall-atlas.webp` — four modular wall variants: armor, utilities, medical
  diagnostics, and emergency corridor.
- `props-atlas.webp` — nine aligned props: capsule, power cabinet, monitoring
  station, mirror/storage, A-07 door, medical console, side table, cable crate,
  and chair.
- `player-atlas.webp` — 32 frames across eight directions, with idle and walk
  contact poses reused at a faster cadence for running. The subject is still a
  deliberately anonymous temporary avatar and is not Echo.
- `items-atlas.webp` — keycard, medical patch, battery, and clue note used in
  both the world and inventory presentation.

The atlases were generated through the built-in image generation workflow on
a removable chroma background, keyed locally, verified for alpha, and
compressed to WebP. The supplied concept image was used only for art direction.
No reference pixels were cropped, and no whole-room image is used as a static
background.

### Runtime Presentation Layers

- The floor is composed once into a Phaser RenderTexture from real isometric
  tile art, keeping runtime draw calls low.
- Modular wall sprites retain independent front-wall occlusion.
- Props use authored sprites while collisions and interactions remain driven by
  the unchanged map data.
- Local light pools, contact shadows, emissive flicker, emergency wash, and
  corridor guidance remain quality-scalable.
- The player has eight-direction frame animation, idle breathing, walk/run
  timing, directional facing, and camera look-ahead.
- Drawer, keycard, power state, screen state, and A-07 opening remain bound to
  the existing saved progression flags.

## Final Art Still Needed

- Canon-approved player or Echo-independent playable character art when the
  final character direction is approved.
- Dedicated open/closed drawer and multi-frame A-07 door animations instead of
  layered runtime motion.
- Additional edge, corner, debris, cable, and wall-damage tile variations for
  larger future wards.
- Final low-volume room ambience and authored interaction SFX.
- Optional normal maps and baked occlusion masks for a future high-quality
  device tier.

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
