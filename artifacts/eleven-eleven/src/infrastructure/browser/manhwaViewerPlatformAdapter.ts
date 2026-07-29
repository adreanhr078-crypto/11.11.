export interface ScreenOrientationPort {
  lock?: (orientation: string) => Promise<void>;
}

export interface ManhwaViewerPlatformAdapter {
  requestPortrait: () => Promise<boolean>;
  restoreLandscape: () => Promise<boolean>;
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
  value: 'portrait' | 'landscape',
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
 * Web-only, best-effort orientation adapter. Unsupported or rejected locks
 * never prevent the Viewer from opening, retrying, or closing.
 */
export function createManhwaViewerPlatformAdapter(
  orientation: ScreenOrientationPort | null = browserOrientation(),
): ManhwaViewerPlatformAdapter {
  return {
    requestPortrait() {
      return bestEffortLock(orientation, 'portrait');
    },
    restoreLandscape() {
      return bestEffortLock(orientation, 'landscape');
    },
  };
}
