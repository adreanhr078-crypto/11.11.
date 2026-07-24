import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import type { GameScreenId } from './shellStore';

export interface GameScreenDefinition {
  id: GameScreenId;
  label: string;
  shortLabel: string;
  code: string;
  tone: 'danger' | 'memory' | 'rare' | 'progression' | 'neutral';
  primary: boolean;
  component: LazyExoticComponent<ComponentType>;
}

const MainMenuScreen = lazy(() => import(
  '../../features/screens/MainMenuScreen'
));
const DashboardScreen = lazy(() => import(
  '../../features/screens/DashboardScreen'
));
const CinematicPlayerScreen = lazy(() => import(
  '../../features/screens/CinematicPlayerScreen'
));
const MemoryScreen = lazy(() => import(
  '../../features/screens/MemoryScreen'
));
const PuzzleScreen = lazy(() => import(
  '../../features/screens/PuzzleScreen'
));
const DialogueScreen = lazy(() => import(
  '../../features/screens/DialogueScreen'
));
const SettingsScreen = lazy(() => import(
  '../../features/screens/SettingsScreen'
));
const DaySection = lazy(() => import(
  '../../components/sections/DaySection'
));
const WishesSection = lazy(() => import(
  '../../components/sections/WishesSection'
));
const FlowerSystem = lazy(() => import(
  '../../components/flower/FlowerSystem'
));
const AchievementsSection = lazy(() => import(
  '../../components/sections/AchievementsSection'
));
const NightTransformation = lazy(() => import(
  '../../components/sections/NightTransformation'
));
const OverviewSection = lazy(() => import(
  '../../components/sections/OverviewSection'
));

export const GAME_SCREEN_REGISTRY: Record<
  GameScreenId,
  GameScreenDefinition
> = {
  'main-menu': {
    id: 'main-menu',
    label: 'القائمة الرئيسية',
    shortLabel: 'الرئيسية',
    code: '00',
    tone: 'danger',
    primary: false,
    component: MainMenuScreen,
  },
  dashboard: {
    id: 'dashboard',
    label: 'نظام Echo',
    shortLabel: 'Echo',
    code: '01',
    tone: 'danger',
    primary: true,
    component: DashboardScreen,
  },
  cinematic: {
    id: 'cinematic',
    label: 'المشهد السينمائي',
    shortLabel: 'المشهد',
    code: '02',
    tone: 'rare',
    primary: true,
    component: CinematicPlayerScreen,
  },
  memories: {
    id: 'memories',
    label: 'شبكة الذاكرة',
    shortLabel: 'الذكريات',
    code: '03',
    tone: 'memory',
    primary: true,
    component: MemoryScreen,
  },
  puzzles: {
    id: 'puzzles',
    label: 'إعادة بناء الذاكرة',
    shortLabel: 'الألغاز',
    code: '04',
    tone: 'progression',
    primary: true,
    component: PuzzleScreen,
  },
  dialogue: {
    id: 'dialogue',
    label: 'التواصل مع Echo',
    shortLabel: 'الحوار',
    code: '05',
    tone: 'memory',
    primary: true,
    component: DialogueScreen,
  },
  day: {
    id: 'day',
    label: 'المسار النهاري',
    shortLabel: 'النهار',
    code: '06',
    tone: 'progression',
    primary: false,
    component: DaySection,
  },
  wishes: {
    id: 'wishes',
    label: 'الأمنيات',
    shortLabel: 'الأمنيات',
    code: '07',
    tone: 'rare',
    primary: false,
    component: WishesSection,
  },
  flowers: {
    id: 'flowers',
    label: 'زهور الذاكرة',
    shortLabel: 'الزهور',
    code: '08',
    tone: 'rare',
    primary: false,
    component: FlowerSystem,
  },
  achievements: {
    id: 'achievements',
    label: 'الإنجازات',
    shortLabel: 'الإنجازات',
    code: '09',
    tone: 'progression',
    primary: false,
    component: AchievementsSection,
  },
  night: {
    id: 'night',
    label: 'التحول الليلي',
    shortLabel: 'الليل',
    code: '10',
    tone: 'danger',
    primary: false,
    component: NightTransformation,
  },
  overview: {
    id: 'overview',
    label: 'سجل النظام',
    shortLabel: 'السجل',
    code: '11',
    tone: 'neutral',
    primary: false,
    component: OverviewSection,
  },
  settings: {
    id: 'settings',
    label: 'الإعدادات',
    shortLabel: 'الإعدادات',
    code: '12',
    tone: 'neutral',
    primary: false,
    component: SettingsScreen,
  },
};

export const PRIMARY_GAME_SCREENS = Object.values(
  GAME_SCREEN_REGISTRY,
).filter((screen) => screen.primary);

export const SECONDARY_GAME_SCREENS = Object.values(
  GAME_SCREEN_REGISTRY,
).filter((screen) => (
  !screen.primary
  && screen.id !== 'main-menu'
  && screen.id !== 'settings'
));

