# Cinematic Episode Authoring

One item in `index.json` represents one anime-style chapter episode. The file
contains authored references and timing only; optimized images, Japanese voice
clips, music and sound effects remain external assets addressed by `asset_*`
IDs.

## Authoring rules

- Episode IDs use `episode_*`.
- Scene IDs use `scene_*` and are unique across the cinematic registry.
- Cue IDs use `cue_*` and are unique inside a scene.
- Character, expression and asset IDs use `character_*`, `expression_*` and
  `asset_*`.
- Coordinates are normalized from `0` to `1`; never author screen pixels.
- Camera zoom is authored independently from the device aspect ratio.
- Dialogue voice tracks use `ja-JP`.
- Every spoken cue requires an Arabic subtitle.
- A choice scene owns one stable `decisionId`. Its chosen option is written to
  the shared Decision Ledger.
- Conditions and effects use the same data-driven rule objects as memories,
  dialogues, puzzles and endings.
- Flashbacks reference a `memory_*` ID instead of duplicating memory content.

## Runtime separation

Zustand stores only the current episode/scene checkpoint, completed IDs,
preferences and Decision Ledger results. Frame time, decoded audio, camera
interpolation and loaded textures belong to the cinematic player, preventing
per-frame persistence and store re-renders.

The authoritative editor schema is
`../schemas/cinematic-episode.schema.json`. Run `npm run validate:content`
after editing.

Cinematic media descriptors live in `../assets/index.json` and are validated
by `../schemas/cinematic-assets.schema.json`.
