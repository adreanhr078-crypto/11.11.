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
}

export const NAVIGATION_CATEGORIES = [
  {
    id: 'story',
    label: 'القصة',
    shortLabel: 'القصة',
    description: 'متابعة الفصل والمشاهد والحوارات.',
    iconId: 'category-story',
    tone: 'danger',
    landingScreenId: 'dashboard',
  },
  {
    id: 'memory',
    label: 'الذاكرة',
    shortLabel: 'الذاكرة',
    description: 'الذكريات المستعادة والشظايا المرتبطة بها.',
    iconId: 'category-memory',
    tone: 'memory',
    landingScreenId: 'memories',
  },
  {
    id: 'investigation',
    label: 'التحقيق',
    shortLabel: 'التحقيق',
    description: 'الألغاز والأدلة وسجل النظام.',
    iconId: 'category-investigation',
    tone: 'memory',
    landingScreenId: 'puzzles',
  },
  {
    id: 'characters',
    label: 'الشخصيات',
    shortLabel: 'الشخصيات',
    description: 'ملفات الشخصيات والعلاقات وتطور Echo.',
    iconId: 'category-characters',
    tone: 'rare',
    landingScreenId: 'night',
  },
  {
    id: 'progress',
    label: 'التقدم',
    shortLabel: 'التقدم',
    description: 'الإنجازات وحالة تقدم الرحلة.',
    iconId: 'category-progress',
    tone: 'progression',
    landingScreenId: 'achievements',
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    shortLabel: 'الإعدادات',
    description: 'الصوت والجودة واللغة وإمكانية الوصول.',
    iconId: 'category-settings',
    tone: 'neutral',
    landingScreenId: 'settings',
  },
] as const satisfies readonly NavigationCategoryDefinition[];

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
