/**
 * The 3D opening room is intentionally retained for a future gameplay pass,
 * but it is not part of the active player flow right now.
 */
export const OPENING_ROOM_3D_ENABLED = false;

export function resolveFeatureGatedScreen(
  screen: string,
): string {
  if (!OPENING_ROOM_3D_ENABLED && screen === 'play') {
    return 'puzzles';
  }
  return screen;
}
