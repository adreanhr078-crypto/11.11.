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
import {
  createInitialExperienceEntitlements,
  resolveExperienceRoute,
  type ExperienceEntitlements,
  type ExperienceLockReason,
} from '../../application/player-journey/playerExperienceEntitlements';
import type {
  AdConsent,
} from '../../domain/echo-network/adPolicy';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
import type { TelemetryConsent } from '../../domain/telemetry/telemetryContracts';

export type { GameScreenId } from './screenRegistry';

export interface RouteAccessNotice {
  requestedScreen: GameScreenId;
  redirectedScreen: GameScreenId;
  reason: ExperienceLockReason;
}

interface ShellState {
  currentScreen: GameScreenId;
  previousScreen: GameScreenId | null;
  navigationCategory: NavigationCategoryId | null;
  pauseOpen: boolean;
  manhwaReaderLaunchRequested: boolean;
  /** A local focus request only; the Puzzle API remains the discovery authority. */
  storyPuzzleDiscoveryRequest: string | null;
  experienceEntitlements: ExperienceEntitlements;
  /** Bumped after a server-owned Network eligibility transition. */
  experienceNetworkRefreshEpoch: number;
  routeAccessNotice: RouteAccessNotice | null;
  navigate: (screen: GameScreenId) => void;
  requestManhwaReader: () => void;
  consumeManhwaReaderLaunch: () => void;
  requestStoryPuzzleDiscovery: (puzzleId: string) => void;
  consumeStoryPuzzleDiscoveryRequest: () => void;
  goBack: () => void;
  setExperienceEntitlements: (entitlements: ExperienceEntitlements) => void;
  requestExperienceNetworkRefresh: () => void;
  dismissRouteAccessNotice: () => void;
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

function resolveShellScreen(
  screen: string,
  entitlements: ExperienceEntitlements,
) {
  const featureResolved = resolveFeatureGatedScreen(
    LEGACY_SCREEN_ALIASES[screen] ?? screen,
  );
  const requestedScreen = GAME_SCREEN_IDS.includes(featureResolved as GameScreenId)
    ? featureResolved as GameScreenId
    : 'main-menu';
  return resolveExperienceRoute(requestedScreen, entitlements);
}

function routeNoticeFrom(
  resolution: ReturnType<typeof resolveShellScreen>,
): RouteAccessNotice | null {
  if (resolution.allowed || !resolution.reason) return null;
  return {
    requestedScreen: resolution.requestedScreen,
    redirectedScreen: resolution.screen,
    reason: resolution.reason,
  };
}

export const useShellStore = create<ShellState>((set, get) => ({
  currentScreen: screenFromLocation(),
  previousScreen: null,
  navigationCategory: null,
  pauseOpen: false,
  manhwaReaderLaunchRequested: false,
  storyPuzzleDiscoveryRequest: null,
  experienceEntitlements: createInitialExperienceEntitlements(),
  experienceNetworkRefreshEpoch: 0,
  routeAccessNotice: null,
  navigate(screen) {
    const resolution = resolveShellScreen(
      screen,
      get().experienceEntitlements,
    );
    const normalized = resolution.screen;
    const current = get().currentScreen;
    writeScreenLocation(
      normalized,
      !resolution.allowed || normalized === current ? 'replace' : 'push',
    );
    if (normalized === current) {
      set({
        navigationCategory: null,
        pauseOpen: false,
        manhwaReaderLaunchRequested: false,
        storyPuzzleDiscoveryRequest: null,
        routeAccessNotice: routeNoticeFrom(resolution),
      });
      return;
    }
    set({
      currentScreen: normalized,
      previousScreen: current,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: false,
      storyPuzzleDiscoveryRequest: null,
      routeAccessNotice: routeNoticeFrom(resolution),
    });
  },
  requestManhwaReader() {
    const resolution = resolveShellScreen(
      'memories',
      get().experienceEntitlements,
    );
    const current = get().currentScreen;
    const screen = resolution.screen;
    writeScreenLocation(
      screen,
      !resolution.allowed || current === screen ? 'replace' : 'push',
    );
    set({
      currentScreen: screen,
      previousScreen: current === screen
        ? get().previousScreen
        : current,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: resolution.allowed && screen === 'memories',
      storyPuzzleDiscoveryRequest: null,
      routeAccessNotice: routeNoticeFrom(resolution),
    });
  },
  consumeManhwaReaderLaunch: () => set({
    manhwaReaderLaunchRequested: false,
  }),
  requestStoryPuzzleDiscovery(puzzleId) {
    const resolution = resolveShellScreen(
      'puzzles',
      get().experienceEntitlements,
    );
    const current = get().currentScreen;
    const screen = resolution.screen;
    writeScreenLocation(
      screen,
      !resolution.allowed || current === screen ? 'replace' : 'push',
    );
    set({
      currentScreen: screen,
      previousScreen: current === screen
        ? get().previousScreen
        : current,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: false,
      storyPuzzleDiscoveryRequest: resolution.allowed && screen === 'puzzles'
        ? puzzleId
        : null,
      routeAccessNotice: routeNoticeFrom(resolution),
    });
  },
  consumeStoryPuzzleDiscoveryRequest: () => set({
    storyPuzzleDiscoveryRequest: null,
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
    get().navigate(previousScreen ?? 'psychological-state');
  },
  setExperienceEntitlements(entitlements) {
    const current = get().currentScreen;
    const resolution = resolveShellScreen(current, entitlements);
    if (!resolution.allowed) {
      writeScreenLocation(resolution.screen, 'replace');
    }
    set({
      experienceEntitlements: entitlements,
      currentScreen: resolution.screen,
      previousScreen: resolution.allowed ? get().previousScreen : null,
      navigationCategory: null,
      pauseOpen: false,
      manhwaReaderLaunchRequested: false,
      storyPuzzleDiscoveryRequest: null,
      routeAccessNotice: routeNoticeFrom(resolution),
    });
  },
  requestExperienceNetworkRefresh() {
    set((state) => ({
      experienceNetworkRefreshEpoch: state.experienceNetworkRefreshEpoch + 1,
    }));
  },
  dismissRouteAccessNotice: () => set({ routeAccessNotice: null }),
  openNavigation: (category) => set({ navigationCategory: category }),
  closeNavigation: () => set({ navigationCategory: null }),
  openPause: () => set({ pauseOpen: true }),
  closePause: () => set({ pauseOpen: false }),
}));

function syncScreenFromLocation(): void {
  const nextScreen = screenFromLocation();
  const shell = useShellStore.getState();
  const resolution = resolveShellScreen(nextScreen, shell.experienceEntitlements);
  const currentScreen = shell.currentScreen;
  if (resolution.screen === currentScreen && resolution.allowed) return;
  if (!resolution.allowed) writeScreenLocation(resolution.screen, 'replace');
  useShellStore.setState({
    currentScreen: resolution.screen,
    previousScreen: null,
    navigationCategory: null,
    pauseOpen: false,
    manhwaReaderLaunchRequested: false,
    storyPuzzleDiscoveryRequest: null,
    routeAccessNotice: routeNoticeFrom(resolution),
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
