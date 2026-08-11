export const PUZZLE_HUB_MODES = [
  {
    id: 'story',
    code: '01',
    eyebrow: 'STORY PUZZLES',
    label: 'ألغاز القصة',
    description: 'عشرون لغزًا قصصيًا: 14 رئيسيًا و6 إشارات سرية.',
  },
  {
    id: 'daily',
    code: '11:11',
    eyebrow: 'DAILY SIGNAL',
    label: 'إشارة 11:11 اليومية',
    description: 'إشارة خادمية متجددة ومكافأة واحدة موثقة لكل دورة.',
  },
  {
    id: 'weekly',
    code: '7D',
    eyebrow: 'SYSTEM TRIAL',
    label: 'اختبار النظام الأسبوعي',
    description: 'مراحل متتابعة، حفظ تلقائي، واستعادة أسبوعية موثقة.',
  },
] as const;

export type PuzzleHubMode = typeof PUZZLE_HUB_MODES[number]['id'];
