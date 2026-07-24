import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  MotionTier,
  QualityTier,
} from '../../ui/design-system';

export type GameScreenId =
  | 'main-menu'
  | 'dashboard'
  | 'cinematic'
  | 'memories'
  | 'puzzles'
  | 'dialogue'
  | 'day'
  | 'wishes'
  | 'flowers'
  | 'achievements'
  | 'night'
  | 'overview'
  | 'settings';

interface ShellState {
  currentScreen: GameScreenId;
  previousScreen: GameScreenId | null;
  navigationOpen: boolean;
  pauseOpen: boolean;
  navigate: (screen: GameScreenId) => void;
  goBack: () => void;
  openNavigation: () => void;
  closeNavigation: () => void;
  openPause: () => void;
  closePause: () => void;
}

const SCREEN_IDS: readonly GameScreenId[] = [
  'main-menu',
  'dashboard',
  'cinematic',
  'memories',
  'puzzles',
  'dialogue',
  'day',
  'wishes',
  'flowers',
  'achievements',
  'night',
  'overview',
  'settings',
];

function screenFromLocation(): GameScreenId {
  if (typeof window === 'undefined') return 'main-menu';
  const candidate = window.location.hash.replace(/^#\/?/, '');
  return SCREEN_IDS.includes(candidate as GameScreenId)
    ? candidate as GameScreenId
    : 'main-menu';
}

function writeScreenLocation(screen: GameScreenId): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', `#/${screen}`);
}

export const useShellStore = create<ShellState>((set, get) => ({
  currentScreen: screenFromLocation(),
  previousScreen: null,
  navigationOpen: false,
  pauseOpen: false,
  navigate(screen) {
    const current = get().currentScreen;
    writeScreenLocation(screen);
    if (screen === current) {
      set({ navigationOpen: false, pauseOpen: false });
      return;
    }
    set({
      currentScreen: screen,
      previousScreen: current,
      navigationOpen: false,
      pauseOpen: false,
    });
  },
  goBack() {
    const { previousScreen } = get();
    writeScreenLocation(previousScreen ?? 'dashboard');
    set({
      currentScreen: previousScreen ?? 'dashboard',
      previousScreen: null,
      navigationOpen: false,
      pauseOpen: false,
    });
  },
  openNavigation: () => set({ navigationOpen: true }),
  closeNavigation: () => set({ navigationOpen: false }),
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
      showTelemetry: true,
      setQuality: (quality) => set({ quality }),
      setMotion: (motion) => set({ motion }),
      setShowTelemetry: (showTelemetry) => set({ showTelemetry }),
    }),
    {
      name: 'eleven_ui_preferences',
      version: 1,
    },
  ),
);
