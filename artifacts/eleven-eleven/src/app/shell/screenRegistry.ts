import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import type { GameTone } from '../../ui/design-system/types';
import type { GameIconId } from '../../ui/icons';
import type { NavigationCategoryId } from './navigationTypes';

export type ScreenNavigationPlacement =
  | 'landing'
  | 'secondary'
  | 'hidden';

interface GameScreenDefinitionSeed {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  code: string;
  tone: GameTone;
  iconId: GameIconId;
  categoryId: NavigationCategoryId;
  navigation: ScreenNavigationPlacement;
  component: LazyExoticComponent<ComponentType>;
}

export const GAME_SCREEN_DEFINITIONS = [
  {
    id: 'main-menu',
    label: 'القائمة الرئيسية',
    shortLabel: 'الرئيسية',
    description: 'بدء الرحلة أو استكمال الاتصال بنظام 11:11.',
    code: '00',
    tone: 'danger',
    iconId: 'screen-main-menu',
    categoryId: 'story',
    navigation: 'hidden',
    component: lazy(() => import(
      '../../features/screens/MainMenuScreen'
    )),
  },
  {
    id: 'dashboard',
    label: 'نظام Echo',
    shortLabel: 'Echo',
    description: 'الحالة الحالية ومسار الرحلة والذاكرة.',
    code: '01',
    tone: 'danger',
    iconId: 'screen-dashboard',
    categoryId: 'story',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/DashboardScreen'
    )),
  },
  {
    id: 'cinematic',
    label: 'المشهد السينمائي',
    shortLabel: 'المشاهد',
    description: 'تشغيل الحلقات والمشاهد المستعادة.',
    code: '02',
    tone: 'rare',
    iconId: 'screen-cinematic',
    categoryId: 'story',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../features/screens/CinematicPlayerScreen'
    )),
  },
  {
    id: 'memories',
    label: 'شبكة الذاكرة',
    shortLabel: 'الذكريات',
    description: 'عرض الذكريات المستعادة وشظاياها.',
    code: '03',
    tone: 'memory',
    iconId: 'screen-memory',
    categoryId: 'memory',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/MemoryScreen'
    )),
  },
  {
    id: 'puzzles',
    label: 'إعادة بناء الذاكرة',
    shortLabel: 'الألغاز',
    description: 'حل الألغاز لإعادة بناء الأحداث المفقودة.',
    code: '04',
    tone: 'memory',
    iconId: 'screen-puzzles',
    categoryId: 'investigation',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/PuzzleScreen'
    )),
  },
  {
    id: 'dialogue',
    label: 'التواصل مع Echo',
    shortLabel: 'الحوار',
    description: 'الحوارات والخيارات والقرارات المسجلة.',
    code: '05',
    tone: 'memory',
    iconId: 'screen-dialogue',
    categoryId: 'story',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../features/screens/DialogueScreen'
    )),
  },
  {
    id: 'day',
    label: 'المسار النهاري',
    shortLabel: 'النهار',
    description: 'حالة الرحلة خارج طور 11:11.',
    code: '06',
    tone: 'progression',
    iconId: 'screen-day',
    categoryId: 'story',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../components/sections/DaySection'
    )),
  },
  {
    id: 'wishes',
    label: 'الأمنيات',
    shortLabel: 'الأمنيات',
    description: 'الروابط الشخصية التي تؤثر في الرحلة.',
    code: '07',
    tone: 'rare',
    iconId: 'screen-wishes',
    categoryId: 'story',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../components/sections/WishesSection'
    )),
  },
  {
    id: 'flowers',
    label: 'زهرة الذاكرة',
    shortLabel: 'الزهرة',
    description: 'قراءة نمو الذاكرة واستقرارها.',
    code: '08',
    tone: 'rare',
    iconId: 'screen-flowers',
    categoryId: 'memory',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../components/flower/FlowerSystem'
    )),
  },
  {
    id: 'achievements',
    label: 'الإنجازات',
    shortLabel: 'الإنجازات',
    description: 'الإنجازات المكتشفة وحالة تقدمها.',
    code: '09',
    tone: 'progression',
    iconId: 'screen-achievements',
    categoryId: 'progress',
    navigation: 'landing',
    component: lazy(() => import(
      '../../components/sections/AchievementsSection'
    )),
  },
  {
    id: 'night',
    label: 'تطور Echo',
    shortLabel: 'Echo',
    description: 'تحولات Echo وتأثير حالته النفسية.',
    code: '10',
    tone: 'danger',
    iconId: 'screen-night',
    categoryId: 'characters',
    navigation: 'landing',
    component: lazy(() => import(
      '../../components/sections/NightTransformation'
    )),
  },
  {
    id: 'overview',
    label: 'سجل النظام',
    shortLabel: 'السجل',
    description: 'الأحداث والقرارات التي اكتشفها اللاعب.',
    code: '11',
    tone: 'neutral',
    iconId: 'screen-overview',
    categoryId: 'investigation',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../components/sections/OverviewSection'
    )),
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    shortLabel: 'الإعدادات',
    description: 'تخصيص اللعبة والصوت والجودة وإمكانية الوصول.',
    code: '12',
    tone: 'neutral',
    iconId: 'screen-settings',
    categoryId: 'settings',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/SettingsScreen'
    )),
  },
] as const satisfies readonly GameScreenDefinitionSeed[];

export type GameScreenId =
  typeof GAME_SCREEN_DEFINITIONS[number]['id'];

export type GameScreenDefinition =
  typeof GAME_SCREEN_DEFINITIONS[number];

export const GAME_SCREEN_REGISTRY = Object.freeze(
  Object.fromEntries(
    GAME_SCREEN_DEFINITIONS.map((definition) => [
      definition.id,
      definition,
    ]),
  ) as Record<GameScreenId, GameScreenDefinition>,
);

export const GAME_SCREEN_IDS = Object.freeze(
  GAME_SCREEN_DEFINITIONS.map(({ id }) => id),
);

export function getScreensForCategory(
  categoryId: NavigationCategoryId,
): GameScreenDefinition[] {
  return GAME_SCREEN_DEFINITIONS.filter((screen) => (
    screen.categoryId === categoryId
    && screen.navigation !== 'hidden'
  ));
}
