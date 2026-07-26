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

export type { GameScreenId } from './screenRegistry';

interface ShellState {
  currentScreen: GameScreenId;
  previousScreen: GameScreenId | null;
  navigationCategory: NavigationCategoryId | null;
  pauseOpen: boolean;
  navigate: (screen: GameScreenId) => void;
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
  navigate(screen) {
    const normalized = resolveFeatureGatedScreen(
      LEGACY_SCREEN_ALIASES[screen] ?? screen,
    ) as GameScreenId;
    const current = get().currentScreen;
    writeScreenLocation(normalized);
    if (normalized === current) {
      set({ navigationCategory: null, pauseOpen: false });
      return;
    }
    set({
      currentScreen: normalized,
      previousScreen: current,
      navigationCategory: null,
      pauseOpen: false,
    });
  },
  goBack() {
    const { previousScreen } = get();
    writeScreenLocation(previousScreen ?? 'psychological-state');
    set({
      currentScreen: previousScreen ?? 'psychological-state',
      previousScreen: null,
      navigationCategory: null,
      pauseOpen: false,
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
  showTelemetry: boolean;
  setQuality: (quality: QualityTier) => void;
  setMotion: (motion: MotionTier) => void;
  setShowTelemetry: (showTelemetry: boolean) => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      quality: 'balanced',
      motion: 'balanced',
      showTelemetry: false,
      setQuality: (quality) => set({ quality }),
      setMotion: (motion) => set({ motion }),
      setShowTelemetry: (showTelemetry) => set({ showTelemetry }),
    }),
    {
      name: 'eleven_ui_preferences',
      version: 2,
      migrate: (persistedState) => ({
        ...(persistedState as Partial<UiPreferencesState>),
        showTelemetry: false,
      }),
    },
  ),
);
