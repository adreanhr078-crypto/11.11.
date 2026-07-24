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
    description: 'الحالة الحالية ومسار الرحلة والقرار التالي.',
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
    description: 'عرض الذكريات المستعادة والشظايا المرتبطة بها.',
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
    categoryId: 'puzzles',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/PuzzleScreen'
    )),
  },
  {
    id: 'echo-mind',
    label: 'Echo Mind',
    shortLabel: 'Echo',
    description: 'التحدث مع Echo وتتبع ردوده ومرجعياته النشطة.',
    code: '05',
    tone: 'danger',
    iconId: 'screen-echo-mind',
    categoryId: 'echo-mind',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/EchoMindScreen'
    )),
  },
  {
    id: 'dialogue',
    label: 'الحوار والقرارات',
    shortLabel: 'الحوار',
    description: 'الحوارات والخيارات والقرارات المسجلة.',
    code: '06',
    tone: 'memory',
    iconId: 'screen-dialogue',
    categoryId: 'story',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../features/screens/DialogueScreen'
    )),
  },
  {
    id: 'characters',
    label: 'ملفات الشخصيات',
    shortLabel: 'الشخصيات',
    description: 'علاقات Echo والشخصيات المرتبطة بمسار القصة.',
    code: '07',
    tone: 'rare',
    iconId: 'screen-characters',
    categoryId: 'characters',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/CharactersScreen'
    )),
  },
  {
    id: 'progress',
    label: 'تقدم الرحلة',
    shortLabel: 'التقدم',
    description: 'الإنجازات والقرارات والنهايات المؤهلة.',
    code: '08',
    tone: 'progression',
    iconId: 'screen-progress',
    categoryId: 'progress',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/ProgressScreen'
    )),
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    shortLabel: 'الإعدادات',
    description: 'تخصيص اللعبة والصوت والجودة وإمكانية الوصول.',
    code: '09',
    tone: 'neutral',
    iconId: 'screen-settings',
    categoryId: 'settings',
    navigation: 'hidden',
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
