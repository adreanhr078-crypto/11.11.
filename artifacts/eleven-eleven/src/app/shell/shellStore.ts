import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MotionTier,
  QualityTier,
} from '../../ui/design-system';
import {
  GAME_SCREEN_IDS,
  type GameScreenId,
} from './screenRegistry';
import type { NavigationCategoryId } from './navigationTypes';
import {
  resolveFeatureGatedScreen,
} from '../config/featureFlags';
import type {
  AdConsent,
} from '../../domain/echo-network/adPolicy';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import type { TelemetryConsent } from '../../domain/telemetry/telemetryContracts';

export type { GameScreenId } from './screenRegistry';

interface ShellState {
  currentScreen: GameScreenId;
  previousScreen: GameScreenId | null;
  navigationCategory: NavigationCategoryId | null;
  pauseOpen: boolean;
  manhwaReaderLaunchRequested: boolean;
  navigate: (screen: GameScreenId) => void;
  requestManhwaReader: () => void;
  consumeManhwaReaderLaunch: () => void;
  goBack: () => void;
  openNavigation: (category: NavigationCategoryId) => void;
  closeNavigation: () => void;
  openPause: () => void;
  closePause: () => void;
}

const LEGACY_SCREEN_ALIASES: Record<string, GameScreenId> = {
  day: 'psychological-state',
  dashboard: 'psychological-state',
  wishes: 'psychological-state',
  flowers: 'memories',
  night: 'psychological-state',
  achievements: 'progress',
  overview: 'progress',
};

const SCREEN_HISTORY_STATE_KEY = '__elevenElevenScreen';

function screenFromLocation(): GameScreenId {
  if (typeof window === 'undefined') return 'main-menu';
  const candidate = window.location.hash.replace(/^#\/?/, '');
  const normalized = resolveFeatureGatedScreen(
    LEGACY_SCREEN_ALIASES[candidate] ?? candidate,
  );
  return GAME_SCREEN_IDS.includes(normalized as GameScreenId)
    ? normalized as GameScreenId
    : 'main-menu';
}

function writeScreenLocation(
  screen: GameScreenId,
  mode: 'push' | 'replace' = 'push',
): void {
  if (typeof window === 'undefined') return;
  const existingState = window.history.state;
  const state = {
    ...(existingState && typeof existingState === 'object' ? existingState : {}),
    [SCREEN_HISTORY_STATE_KEY]: true,
    screen,
  };
  if (mode === 'replace') window.history.replaceState(state, '', `#/${screen}`);
  else window.history.pushState(state, '', `#/${screen}`);
}

export const useShellStore = create<ShellState>((set, get) => ({
  currentScreen: screenFromLocation(),
  previousScreen: null,
  navigationCategory: null,
  pauseOpen: false,
  manhwaReaderLaunchRequested: false,
  navigate(screen) {
    const normalized = resolveFeatureGatedScreen(
      LEGACY_SCREEN_ALIASES[screen] ?? screen,
    ) as GameScreenId;
    const current = get().currentScreen;
    writeScreenLocation(normalized, normalized === current ? 'replace' : 'push');
    if (normalized === current) {
      set({
        navigationCategory: null,
        pauseOpen: false,
        manhwaReaderLaunchRequested: false,
      });
      return;
    }
    set({
      currentScreen: normalized,
      previousScreen: current,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: false,
    });
  },
  requestManhwaReader() {
    const current = get().currentScreen;
    writeScreenLocation('memories', current === 'memories' ? 'replace' : 'push');
    set({
      currentScreen: 'memories',
      previousScreen: current === 'memories'
        ? get().previousScreen
        : current,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: true,
    });
  },
  consumeManhwaReaderLaunch: () => set({
    manhwaReaderLaunchRequested: false,
  }),
  goBack() {
    const { previousScreen } = get();
    if (
      typeof window !== 'undefined'
      && window.history.state?.[SCREEN_HISTORY_STATE_KEY]
      && window.history.length > 1
    ) {
      window.history.back();
      return;
    }
    writeScreenLocation(previousScreen ?? 'psychological-state', 'replace');
    set({
      currentScreen: previousScreen ?? 'psychological-state',
      previousScreen: null,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: false,
    });
  },
  openNavigation: (category) => set({ navigationCategory: category }),
  closeNavigation: () => set({ navigationCategory: null }),
  openPause: () => set({ pauseOpen: true }),
  closePause: () => set({ pauseOpen: false }),
}));

function syncScreenFromLocation(): void {
  const nextScreen = screenFromLocation();
  const currentScreen = useShellStore.getState().currentScreen;
  if (nextScreen === currentScreen) return;
  useShellStore.setState({
    currentScreen: nextScreen,
    previousScreen: null,
    navigationCategory: null,
    pauseOpen: false,
    manhwaReaderLaunchRequested: false,
  });
}

if (typeof window !== 'undefined') {
  const initialScreen = screenFromLocation();
  const existingState = window.history.state;
  if (!existingState?.[SCREEN_HISTORY_STATE_KEY]) {
    window.history.replaceState(
      {
        ...(existingState && typeof existingState === 'object' ? existingState : {}),
        [SCREEN_HISTORY_STATE_KEY]: true,
        screen: initialScreen,
      },
      '',
      `#/${initialScreen}`,
    );
  }
  window.addEventListener('hashchange', syncScreenFromLocation);
  window.addEventListener('popstate', syncScreenFromLocation);
}

interface UiPreferencesState {
  quality: QualityTier;
  motion: MotionTier;
  audioEnabled: boolean;
  sfxVolume: number;
  showTelemetry: boolean;
  telemetryConsent: TelemetryConsent;
  locale: NetworkLocale;
  adConsent: AdConsent;
  notificationsEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  setQuality: (quality: QualityTier) => void;
  setMotion: (motion: MotionTier) => void;
  setAudioEnabled: (audioEnabled: boolean) => void;
  setSfxVolume: (sfxVolume: number) => void;
  setShowTelemetry: (showTelemetry: boolean) => void;
  setTelemetryConsent: (telemetryConsent: TelemetryConsent) => void;
  setLocale: (locale: NetworkLocale) => void;
  setAdConsent: (adConsent: AdConsent) => void;
  setNotificationsEnabled: (notificationsEnabled: boolean) => void;
  setQuietHours: (start: number, end: number) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      quality: 'balanced',
      motion: 'balanced',
      audioEnabled: true,
      sfxVolume: 0.7,
      showTelemetry: false,
      telemetryConsent: 'unset',
      locale: 'ar',
      adConsent: 'unset',
      notificationsEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 8,
      setQuality: (quality) => set({ quality }),
      setMotion: (motion) => set({ motion }),
      setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
      setSfxVolume: (sfxVolume) => set({
        sfxVolume: Math.min(1, Math.max(0, sfxVolume)),
      }),
      setShowTelemetry: (showTelemetry) => set({ showTelemetry }),
      setTelemetryConsent: (telemetryConsent) => set({ telemetryConsent }),
      setLocale: (locale) => set({ locale }),
      setAdConsent: (adConsent) => set({ adConsent }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setQuietHours: (start, end) => set({
        quietHoursStart: Math.min(23, Math.max(0, Math.floor(start))),
        quietHoursEnd: Math.min(23, Math.max(0, Math.floor(end))),
      }),
    }),
    {
      name: 'eleven_ui_preferences',
      version: 5,
      migrate: (persistedState) => {
        const previous = persistedState as Partial<UiPreferencesState>;
        return {
          ...previous,
          audioEnabled: previous.audioEnabled ?? true,
          sfxVolume: typeof previous.sfxVolume === 'number'
            ? Math.min(1, Math.max(0, previous.sfxVolume))
            : 0.7,
          showTelemetry: false,
          telemetryConsent: previous.telemetryConsent === 'granted'
            || previous.telemetryConsent === 'declined'
            ? previous.telemetryConsent
            : 'unset',
          locale: previous.locale === 'en' ? 'en' : 'ar',
          adConsent: previous.adConsent === 'contextual'
            || previous.adConsent === 'declined'
            ? previous.adConsent
            : 'unset',
          notificationsEnabled: previous.notificationsEnabled ?? false,
          quietHoursStart: typeof previous.quietHoursStart === 'number'
            ? previous.quietHoursStart
            : 22,
          quietHoursEnd: typeof previous.quietHoursEnd === 'number'
            ? previous.quietHoursEnd
            : 8,
        };
      },
    },
  ),
);
