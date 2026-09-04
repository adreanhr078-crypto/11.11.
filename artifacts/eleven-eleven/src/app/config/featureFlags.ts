export type FeatureFlagKey =
  | 'openingRoom3d'
  | 'awakeningWard'
  | 'legacyPuzzleArchive'
  | 'telemetry'
  | 'communityPresetChat'
  | 'communityFreeText'
  | 'puzzleForgePublishing';

export type FeatureFlagEnvironment = Record<string, string | undefined>;

export interface FeatureFlags {
  readonly openingRoom3d: boolean;
  readonly awakeningWard: boolean;
  readonly legacyPuzzleArchive: boolean;
  readonly telemetry: boolean;
  readonly communityPresetChat: boolean;
  readonly communityFreeText: boolean;
  readonly puzzleForgePublishing: boolean;
}

const runtimeEnv = (import.meta as ImportMeta & {
  env?: ImportMetaEnv;
}).env as FeatureFlagEnvironment | undefined;

function booleanFlag(
  environment: FeatureFlagEnvironment | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = environment?.[key]?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

/**
 * Moderation-sensitive and experimental features fail closed. This local
 * registry becomes the stable contract for remote rollout in a later phase.
 */
export function createFeatureFlags(
  environment: FeatureFlagEnvironment | undefined = runtimeEnv,
): FeatureFlags {
  return Object.freeze({
    openingRoom3d: false,
    awakeningWard: booleanFlag(environment, 'VITE_AWAKENING_WARD_ENABLED', false),
    legacyPuzzleArchive: booleanFlag(
      environment,
      'VITE_LEGACY_PUZZLE_ARCHIVE_ENABLED',
      true,
    ),
    telemetry: booleanFlag(environment, 'VITE_TELEMETRY_ENABLED', false),
    communityPresetChat: booleanFlag(
      environment,
      'VITE_COMMUNITY_PRESET_CHAT_ENABLED',
      true,
    ),
    communityFreeText: booleanFlag(
      environment,
      'VITE_COMMUNITY_FREE_TEXT_ENABLED',
      false,
    ),
    puzzleForgePublishing: booleanFlag(
      environment,
      'VITE_PUZZLE_FORGE_PUBLISHING_ENABLED',
      false,
    ),
  });
}

export const FEATURE_FLAGS = createFeatureFlags();

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key];
}

/** The legacy flag remains exported for compatibility; opening access is now
 * controlled by the server-issued opening gateway entitlement. */
export const OPENING_ROOM_3D_ENABLED = FEATURE_FLAGS.openingRoom3d;

/** Awakening Ward remains shipped and save-compatible while its pass is paused. */
export const AWAKENING_WARD_ENABLED = FEATURE_FLAGS.awakeningWard;

export const LEGACY_PUZZLE_ARCHIVE_ENABLED = FEATURE_FLAGS.legacyPuzzleArchive;

export function resolveFeatureGatedScreen(
  screen: string,
): string {
  if (!AWAKENING_WARD_ENABLED && screen === 'awakening-ward') {
    return 'puzzles';
  }
  if (screen === 'live-challenges') {
    return 'puzzles';
  }
  return screen;
}
