/**
 * The 3D opening room is intentionally retained for a future gameplay pass,
 * but it is not part of the active player flow right now.
 */
export const OPENING_ROOM_3D_ENABLED = false;
const runtimeEnv = (import.meta as ImportMeta & {
  env?: ImportMetaEnv;
}).env;

/**
 * Awakening Ward stays shipped and save-compatible while its gameplay pass is
 * paused. Set the environment flag to true to restore its entry points.
 */
export const AWAKENING_WARD_ENABLED = (
  runtimeEnv?.VITE_AWAKENING_WARD_ENABLED === 'true'
);

export const LEGACY_PUZZLE_ARCHIVE_ENABLED = (
  runtimeEnv?.VITE_LEGACY_PUZZLE_ARCHIVE_ENABLED !== 'false'
);

export function resolveFeatureGatedScreen(
  screen: string,
): string {
  if (!OPENING_ROOM_3D_ENABLED && screen === 'play') {
    if (AWAKENING_WARD_ENABLED) return 'awakening-ward';
    return 'puzzles';
  }
  if (!AWAKENING_WARD_ENABLED && screen === 'awakening-ward') {
    return 'puzzles';
  }
  if (screen === 'live-challenges') {
    return 'puzzles';
  }
  return screen;
}
