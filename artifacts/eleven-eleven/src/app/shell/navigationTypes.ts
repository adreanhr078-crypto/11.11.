export const NAVIGATION_CATEGORY_IDS = [
  'story',
  'memory',
  'investigation',
  'characters',
  'progress',
  'settings',
] as const;

export type NavigationCategoryId =
  typeof NAVIGATION_CATEGORY_IDS[number];
