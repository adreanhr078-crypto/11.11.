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

function writeScreenLocation(screen: GameScreenId): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', `#/${screen}`);
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
    writeScreenLocation(normalized);
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
    writeScreenLocation('memories');
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
    writeScreenLocation(previousScreen ?? 'psychological-state');
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

interface UiPreferencesState {
  quality: QualityTier;
  motion: MotionTier;
  audioEnabled: boolean;
  sfxVolume: number;
  showTelemetry: boolean;
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
      version: 4,
      migrate: (persistedState) => {
        const previous = persistedState as Partial<UiPreferencesState>;
        return {
          ...previous,
          audioEnabled: previous.audioEnabled ?? true,
          sfxVolume: typeof previous.sfxVolume === 'number'
            ? Math.min(1, Math.max(0, previous.sfxVolume))
            : 0.7,
          showTelemetry: false,
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
