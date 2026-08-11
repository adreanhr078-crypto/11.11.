export const NAVIGATION_CATEGORY_IDS = [
  'story',
  'memory',
  'puzzles',
  'network',
  'echo-mind',
  'characters',
  'progress',
  'settings',
] as const;

export type NavigationCategoryId =
  typeof NAVIGATION_CATEGORY_IDS[number];
