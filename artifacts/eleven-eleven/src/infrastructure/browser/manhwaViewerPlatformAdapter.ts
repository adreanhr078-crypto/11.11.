type OrientationLockValue =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

const ORIENTATION_LOCK_VALUES = new Set<OrientationLockValue>([
  'any',
  'natural',
  'landscape',
  'portrait',
  'portrait-primary',
  'portrait-secondary',
  'landscape-primary',
  'landscape-secondary',
]);

function asOrientationLockValue(value: string | undefined): OrientationLockValue | null {
  return value && ORIENTATION_LOCK_VALUES.has(value as OrientationLockValue)
    ? value as OrientationLockValue
    : null;
}

export interface ScreenOrientationPort {
  type?: string;
  lock?: (orientation: OrientationLockValue) => Promise<void>;
  unlock?: () => void;
}

export interface ManhwaViewerPlatformAdapter {
  requestPortrait: () => Promise<boolean>;
  restorePreviousOrientation: () => Promise<boolean>;
}

function browserOrientation(): ScreenOrientationPort | null {
  if (typeof window === 'undefined') return null;
  const orientation = window.screen.orientation;
  return orientation
    ? orientation as unknown as ScreenOrientationPort
    : null;
}

async function bestEffortLock(
  orientation: ScreenOrientationPort | null,
  value: OrientationLockValue,
): Promise<boolean> {
  if (!orientation?.lock) return false;
  try {
    await orientation.lock(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Web-only, best-effort orientation adapter. When a portrait lock succeeds,
 * the Viewer restores the device's prior orientation rather than imposing a
 * landscape policy on close. Unsupported or rejected locks never prevent the
 * Viewer from opening, retrying, or closing.
 */
export function createManhwaViewerPlatformAdapter(
  orientation: ScreenOrientationPort | null = browserOrientation(),
): ManhwaViewerPlatformAdapter {
  let previousOrientation: OrientationLockValue | null = null;
  let ownsPortraitLock = false;

  return {
    async requestPortrait() {
      if (!orientation?.lock) return false;
      if (!ownsPortraitLock && previousOrientation === null) {
        previousOrientation = asOrientationLockValue(orientation.type);
      }
      const locked = await bestEffortLock(orientation, 'portrait');
      if (locked) {
        ownsPortraitLock = true;
      } else if (!ownsPortraitLock) {
        previousOrientation = null;
      }
      return locked;
    },
    async restorePreviousOrientation() {
      if (!ownsPortraitLock) return false;
      const restoreTo = previousOrientation;
      previousOrientation = null;
      ownsPortraitLock = false;
      if (restoreTo) return bestEffortLock(orientation, restoreTo);
      try {
        orientation?.unlock?.();
        return Boolean(orientation?.unlock);
      } catch {
        return false;
      }
    },
  };
}
