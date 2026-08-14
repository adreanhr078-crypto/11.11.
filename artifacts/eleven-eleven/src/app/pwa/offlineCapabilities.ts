export type OfflineAvailability = 'available' | 'limited' | 'unavailable';

export interface OfflineCapability {
  availability: OfflineAvailability;
  allowsServerProgress: false;
  allowsVerifiedRewards: false;
  fallback: 'local-archive' | 'local-settings' | 'connection-required';
}

const LOCAL_ARCHIVE_SCREENS = new Set(['main-menu', 'memories']);
const LOCAL_SETTINGS_SCREENS = new Set(['settings']);
const LIMITED_SCREENS = new Set(['puzzles', 'echo-network', 'live-challenges']);

const CONNECTION_REQUIRED: OfflineCapability = Object.freeze({
  availability: 'unavailable',
  allowsServerProgress: false,
  allowsVerifiedRewards: false,
  fallback: 'connection-required',
});

const LOCAL_ARCHIVE: OfflineCapability = Object.freeze({
  availability: 'available',
  allowsServerProgress: false,
  allowsVerifiedRewards: false,
  fallback: 'local-archive',
});

const LOCAL_SETTINGS: OfflineCapability = Object.freeze({
  availability: 'available',
  allowsServerProgress: false,
  allowsVerifiedRewards: false,
  fallback: 'local-settings',
});

const LIMITED: OfflineCapability = Object.freeze({
  availability: 'limited',
  allowsServerProgress: false,
  allowsVerifiedRewards: false,
  fallback: 'connection-required',
});

/**
 * Cached presentation is not proof that a server-owned progress or reward
 * action can be completed, so this policy deliberately stays conservative.
 */
export function offlineCapabilityForScreen(screenId: string): OfflineCapability {
  if (LOCAL_ARCHIVE_SCREENS.has(screenId)) return LOCAL_ARCHIVE;
  if (LOCAL_SETTINGS_SCREENS.has(screenId)) return LOCAL_SETTINGS;
  if (LIMITED_SCREENS.has(screenId)) return LIMITED;
  return CONNECTION_REQUIRED;
}

export function canUseServerOwnedAction(online: boolean): boolean {
  return online;
}
