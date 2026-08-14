import { useEffect, useRef, useState } from 'react';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useShellStore, useUiPreferencesStore } from '../shell/shellStore';
import {
  canEmitTelemetry,
  type PlayerTelemetryEvent,
  type PlayerTelemetrySurface,
} from '../../domain/telemetry/telemetryContracts';
import { submitPlayerTelemetry } from '../../infrastructure/player-progression/playerProgressionApi';
import { useAuthStore } from '../../features/auth/authStore';

export function telemetrySurfaceForScreen(screenId: string): PlayerTelemetrySurface {
  if (screenId === 'main-menu') return 'main-menu';
  if (screenId === 'psychological-state' || screenId === 'dialogue') return 'story';
  if (screenId === 'memories') return 'manhwa';
  if (screenId === 'puzzles' || screenId === 'live-challenges') return 'puzzles';
  if (screenId === 'echo-network') return 'echo-network';
  return 'app';
}

function telemetryPlatform(): PlayerTelemetryEvent['platform'] {
  if (typeof window === 'undefined') return 'web';
  const native = (window as Window & {
    Capacitor?: { getPlatform?: () => string };
    __TAURI_INTERNALS__?: unknown;
  }).Capacitor?.getPlatform?.();
  if (native === 'android' || native === 'ios') return native;
  if ('__TAURI_INTERNALS__' in window) return 'desktop';
  if (window.matchMedia?.('(display-mode: standalone)').matches) return 'pwa';
  return 'web';
}

function browserOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * This bridge sends a bounded aggregate event only after player consent and
 * the public flag. The Worker independently requires its server-side flag.
 */
export function TelemetryBridge() {
  const [online, setOnline] = useState(browserOnline);
  const status = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const locale = useUiPreferencesStore((state) => state.locale);
  const consent = useUiPreferencesStore((state) => state.telemetryConsent);
  const currentScreen = useShellStore((state) => state.currentScreen);
  const sentRef = useRef(new Set<string>());
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    const update = () => setOnline(browserOnline());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (activeUidRef.current !== uid) {
      activeUidRef.current = uid;
      sentRef.current.clear();
    }
    if (!uid || !canEmitTelemetry({
      featureEnabled: FEATURE_FLAGS.telemetry,
      serverEnabled: true,
      consent,
      signedIn: status === 'signed-in',
      online,
    })) return;

    const send = (key: string, event: PlayerTelemetryEvent) => {
      if (sentRef.current.has(key)) return;
      sentRef.current.add(key);
      void submitPlayerTelemetry(event, uid);
    };
    const base = {
      version: 1 as const,
      locale,
      platform: telemetryPlatform(),
      networkState: 'online' as const,
    };
    send('application_started', {
      ...base,
      event: 'application_started',
      surface: 'app',
    });
    send(`screen_viewed:${currentScreen}`, {
      ...base,
      event: 'screen_viewed',
      surface: telemetrySurfaceForScreen(currentScreen),
    });
  }, [consent, currentScreen, locale, online, status, uid]);

  return null;
}
