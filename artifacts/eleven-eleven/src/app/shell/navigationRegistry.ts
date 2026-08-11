import type { GameTone } from '../../ui/design-system/types';
import type { GameIconId } from '../../ui/icons';
import {
  GAME_SCREEN_REGISTRY,
  getScreensForCategory,
  type GameScreenDefinition,
  type GameScreenId,
} from './screenRegistry';
import {
  NAVIGATION_CATEGORY_IDS,
  type NavigationCategoryId,
} from './navigationTypes';

export interface NavigationCategoryDefinition {
  id: NavigationCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  iconId: GameIconId;
  tone: GameTone;
  landingScreenId: GameScreenId;
  primary: boolean;
}

export const NAVIGATION_CATEGORIES = [
  {
    id: 'story',
    label: 'الرئيسية',
    shortLabel: 'الرئيسية',
    description: 'حالة Echo الحالية وبوابة الرحلة والملفات المرتبطة بالقصة.',
    iconId: 'category-story',
    tone: 'danger',
    landingScreenId: 'psychological-state',
    primary: true,
  },
  {
    id: 'memory',
    label: 'المانهوا',
    shortLabel: 'المانهوا',
    description: 'أرشيف صفحات المانهوا وفتحها باستخدام شظايا الذاكرة.',
    iconId: 'category-memory',
    tone: 'memory',
    landingScreenId: 'memories',
    primary: true,
  },
  {
    id: 'puzzles',
    label: 'الألغاز',
    shortLabel: 'الألغاز',
    description: 'حل العقد وإعادة بناء الأحداث المفقودة.',
    iconId: 'category-puzzles',
    tone: 'memory',
    landingScreenId: 'puzzles',
    primary: true,
  },
  {
    id: 'network',
    label: 'شبكة Echo',
    shortLabel: 'الشبكة',
    description: 'الشطرنج والتعاون والمواسم ومجتمع الإشارة في مركز واحد.',
    iconId: 'category-network',
    tone: 'rare',
    landingScreenId: 'echo-network',
    primary: true,
  },
  {
    id: 'echo-mind',
    label: 'Echo Mind',
    shortLabel: 'Echo',
    description: 'التحدث مع Echo ومراجعة حالته وردوده ومرجعياته.',
    iconId: 'category-echo-mind',
    tone: 'danger',
    landingScreenId: 'echo-mind',
    primary: false,
  },
  {
    id: 'characters',
    label: 'الشخصيات',
    shortLabel: 'الشخصيات',
    description: 'ملفات الشخصيات والعلاقات وتأثيرها على الرحلة.',
    iconId: 'category-characters',
    tone: 'rare',
    landingScreenId: 'characters',
    primary: false,
  },
  {
    id: 'progress',
    label: 'الترتيب العالمي',
    shortLabel: 'الترتيب',
    description: 'ترتيب اللاعبين عالميًا حسب إجمالي نقاط الخبرة.',
    iconId: 'category-progress',
    tone: 'progression',
    landingScreenId: 'leaderboard',
    primary: false,
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    shortLabel: 'الإعدادات',
    description: 'الصوت والجودة واللغة وإمكانية الوصول.',
    iconId: 'category-settings',
    tone: 'neutral',
    landingScreenId: 'settings',
    primary: false,
  },
] as const satisfies readonly NavigationCategoryDefinition[];

export const PRIMARY_NAVIGATION_CATEGORIES = NAVIGATION_CATEGORIES.filter(
  (category) => category.primary,
);

export const NAVIGATION_CATEGORY_REGISTRY = Object.freeze(
  Object.fromEntries(
    NAVIGATION_CATEGORIES.map((category) => [category.id, category]),
  ) as Record<NavigationCategoryId, NavigationCategoryDefinition>,
);

export function getNavigationCategoryForScreen(
  screenId: GameScreenId,
): NavigationCategoryDefinition {
  return NAVIGATION_CATEGORY_REGISTRY[
    GAME_SCREEN_REGISTRY[screenId].categoryId
  ];
}

export function getCategoryScreens(
  categoryId: NavigationCategoryId,
): GameScreenDefinition[] {
  return getScreensForCategory(categoryId);
}

export function validateNavigationRegistry(): void {
  const categoryIds = new Set(
    NAVIGATION_CATEGORIES.map(({ id }) => id),
  );
  if (categoryIds.size !== NAVIGATION_CATEGORY_IDS.length) {
    throw new Error('Navigation category IDs must be unique');
  }

  for (const categoryId of NAVIGATION_CATEGORY_IDS) {
    const category = NAVIGATION_CATEGORY_REGISTRY[categoryId];
    if (!category) {
      throw new Error(`Missing navigation category: ${categoryId}`);
    }
    const landing = GAME_SCREEN_REGISTRY[category.landingScreenId];
    if (!landing || landing.categoryId !== categoryId) {
      throw new Error(
        `${categoryId} has an invalid landing screen`,
      );
    }
  }

  for (const screen of Object.values(GAME_SCREEN_REGISTRY)) {
    if (!NAVIGATION_CATEGORY_REGISTRY[screen.categoryId]) {
      throw new Error(
        `${screen.id} references missing category ${screen.categoryId}`,
      );
    }
  }
}

validateNavigationRegistry();
