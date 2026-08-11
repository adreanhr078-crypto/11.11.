import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import type { GameTone } from '../../ui/design-system/types';
import type { GameIconId } from '../../ui/icons';
import type { NavigationCategoryId } from './navigationTypes';
import {
  AWAKENING_WARD_ENABLED,
} from '../config/featureFlags';

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
    id: 'psychological-state',
    label: 'الحالة النفسية',
    shortLabel: 'الحالة النفسية',
    description: 'قراءة حالة Echo العاطفية وتأثير قرارات اللاعب عليها.',
    code: '01',
    tone: 'danger',
    iconId: 'screen-psychological-state',
    categoryId: 'story',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/screens/PsychologicalStateScreen'
    )),
  },
  {
    id: 'play',
    label: 'الغرفة الافتتاحية',
    shortLabel: 'اللعب',
    description: 'الدخول إلى أول مساحة ثلاثية الأبعاد داخل نظام 11:11.',
    code: 'PLAY',
    tone: 'memory',
    iconId: 'screen-gameplay',
    categoryId: 'story',
    navigation: 'hidden',
    component: lazy(() => import(
      '../../features/screens/GameplayScreen'
    )),
  },
  {
    id: 'dashboard',
    label: 'نظام Echo',
    shortLabel: 'Echo',
    description: 'الحالة الحالية ومسار الرحلة والقرار التالي.',
    code: 'L1',
    tone: 'danger',
    iconId: 'screen-dashboard',
    categoryId: 'story',
    navigation: 'hidden',
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
    navigation: 'hidden',
    component: lazy(() => import(
      '../../features/screens/CinematicPlayerScreen'
    )),
  },
  {
    id: 'memories',
    label: 'المانهوا',
    shortLabel: 'المانهوا',
    description: 'Manhwa Archive // أرشيف الصفحات المفتوحة والمقفلة.',
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
    id: 'awakening-ward',
    label: 'Awakening Ward — A-01',
    shortLabel: 'A-01',
    description: 'أول جناح قابل للعب داخل منشأة 11:11.',
    code: 'A-01',
    tone: 'danger',
    iconId: 'screen-gameplay',
    categoryId: 'puzzles',
    navigation: AWAKENING_WARD_ENABLED ? 'landing' : 'hidden',
    component: lazy(() => import(
      '../../features/awakening-ward/AwakeningWardScreen'
    )),
  },
  {
    id: 'puzzles',
    label: 'مركز الألغاز 11:11',
    shortLabel: 'الألغاز',
    description: 'المسار القصصي وإشارة 11:11 اليومية واختبار النظام الأسبوعي.',
    code: '04',
    tone: 'memory',
    iconId: 'screen-puzzles',
    categoryId: 'puzzles',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/puzzle-hub/PuzzleHubScreen'
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
    navigation: 'hidden',
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
    id: 'leaderboard',
    label: 'الترتيب العالمي',
    shortLabel: 'الترتيب',
    description: 'ترتيب اللاعبين عالميًا حسب إجمالي نقاط الخبرة.',
    code: '08',
    tone: 'progression',
    iconId: 'screen-leaderboard',
    categoryId: 'progress',
    navigation: 'landing',
    component: lazy(() => import(
      '../../features/player-progression/LeaderboardScreen'
    )),
  },
  {
    id: 'profile',
    label: 'PLAYER PROFILE',
    shortLabel: 'Profile',
    description: 'Identity, level, XP, and verified player statistics.',
    code: 'P01',
    tone: 'progression',
    iconId: 'screen-characters',
    categoryId: 'settings',
    navigation: 'hidden',
    component: lazy(() => import(
      '../../features/player-progression/ProfileScreen'
    )),
  },
  {
    id: 'progress',
    label: 'مجموعة الاستعادة',
    shortLabel: 'المجموعة',
    description: 'الشظايا والأسرار والإنجازات وسجل استعادة النظام.',
    code: '08',
    tone: 'progression',
    iconId: 'screen-progress',
    categoryId: 'progress',
    navigation: 'secondary',
    component: lazy(() => import(
      '../../features/screens/ProgressScreen'
    )),
  },
  {
    id: 'live-challenges',
    label: 'LIVE SIGNALS // 11:11',
    shortLabel: 'LIVE',
    description: 'Daily 11:11 Signal and Weekly System Trial.',
    code: 'LIVE',
    tone: 'danger',
    iconId: 'screen-live-challenges',
    categoryId: 'progress',
    navigation: 'hidden',
    component: lazy(() => import(
      '../../features/live-challenges/LiveChallengesScreen'
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
