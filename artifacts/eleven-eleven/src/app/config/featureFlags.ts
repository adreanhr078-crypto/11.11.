/**
 * The 3D opening room is intentionally retained for a future gameplay pass,
 * but it is not part of the active player flow right now.
 */
export const OPENING_ROOM_3D_ENABLED = false;
const runtimeEnv = (import.meta as ImportMeta & {
  env?: ImportMetaEnv;
}).env;
export const LEGACY_PUZZLE_ARCHIVE_ENABLED = (
  runtimeEnv?.VITE_LEGACY_PUZZLE_ARCHIVE_ENABLED === 'true'
);

export function resolveFeatureGatedScreen(
  screen: string,
): string {
  if (!OPENING_ROOM_3D_ENABLED && screen === 'play') {
    return 'awakening-ward';
  }
  if (!LEGACY_PUZZLE_ARCHIVE_ENABLED && screen === 'puzzles') {
    return 'awakening-ward';
  }
  return screen;
}
