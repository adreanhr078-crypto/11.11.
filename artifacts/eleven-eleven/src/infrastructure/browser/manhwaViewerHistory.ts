const MANHWA_VIEWER_HISTORY_KEY = '__elevenElevenManhwaViewer';

export interface ManhwaViewerHistoryPort {
  readonly locationHref: string;
  readonly state: unknown;
  pushState: (state: unknown, url: string) => void;
  back: () => void;
  addPopStateListener: (listener: () => void) => void;
  removePopStateListener: (listener: () => void) => void;
}

function stateRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? { ...value }
    : {};
}

export function createBrowserManhwaViewerHistoryPort():
  ManhwaViewerHistoryPort | null {
  if (typeof window === 'undefined') return null;
  return {
    get locationHref() {
      return window.location.href;
    },
    get state() {
      return window.history.state;
    },
    pushState(state, url) {
      window.history.pushState(state, '', url);
    },
    back() {
      window.history.back();
    },
    addPopStateListener(listener) {
      window.addEventListener('popstate', listener);
    },
    removePopStateListener(listener) {
      window.removeEventListener('popstate', listener);
    },
  };
}

/**
 * Owns exactly one same-URL history marker for a Viewer session.
 * Browser Back consumes that marker and closes the Viewer without routing.
 */
export class ManhwaViewerHistoryMarker {
  private active = false;

  private onBack: (() => void) | null = null;

  private readonly handlePopState = () => {
    if (!this.active) return;
    this.active = false;
    this.port?.removePopStateListener(this.handlePopState);
    const callback = this.onBack;
    this.onBack = null;
    callback?.();
  };

  constructor(private readonly port: ManhwaViewerHistoryPort | null) {}

  open(onBack: () => void): void {
    const port = this.port;
    if (this.active || !port) return;
    this.active = true;
    this.onBack = onBack;
    port.addPopStateListener(this.handlePopState);
    port.pushState(
      {
        ...stateRecord(port.state),
        [MANHWA_VIEWER_HISTORY_KEY]: true,
      },
      port.locationHref,
    );
  }

  close(): void {
    if (!this.active || !this.port) return;
    this.active = false;
    this.onBack = null;
    this.port.removePopStateListener(this.handlePopState);
    this.port.back();
  }

  dispose(): void {
    this.close();
  }
}
