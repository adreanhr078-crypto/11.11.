export interface ExpandedEnding {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  story?: string;
  storyAr?: string;
  requirements: string[];
  unlockCondition: string;
}

export const ExpandedEndingSystem = {
  endings: [
    {
      id: 'echo_ending',
      name: 'نهاية إيكو',
      nameAr: 'نهاية إيكو',
      description: 'Echo finds peace',
      story: 'Echo finds peace and remembers his true identity.',
      storyAr: 'يجد إيكو السلام ويتذكر هويته الحقيقية.',
      requirements: ['trust > 70', 'memoryStability > 70'],
      unlockCondition: 'trust > 70 && memoryStability > 70',
    },
    {
      id: 'architect_ending',
      name: 'نهاية المهندس',
      nameAr: 'نهاية المهندس',
      description: 'Kenja wins',
      story: 'Architect gains full control over Echo and the system.',
      storyAr: 'يسيطر المهندس على إيكو والنظام.',
      requirements: ['corruption > 60', 'memoryStability < 30'],
      unlockCondition: 'corruption > 60 && memoryStability < 30',
    },
    {
      id: 'signal_ending',
      name: 'نهاية الإشارة',
      nameAr: 'نهاية الإشارة',
      description: 'Lina is free',
      story: 'Echo escapes with Signal and they find freedom together.',
      storyAr: 'يهرب إيكو مع الإشارة ويجدان الحرية معاً.',
      requirements: ['awareness > 70', 'hope > 60'],
      unlockCondition: 'awareness > 70 && hope > 60',
    },
    {
      id: 'true_memory_ending',
      name: 'الذكرى الحقيقية',
      nameAr: 'الذكرى الحقيقية',
      description: 'All memories restored',
      story: 'Echo remembers everything and reveals the full truth.',
      storyAr: 'يتذكر إيكو كل شيء ويكشف الحقيقة الكاملة.',
      requirements: ['all configured puzzles', 'all achievements'],
      unlockCondition: 'progression complete',
    },
    {
      id: 'last_wish_ending',
      name: 'الأمنية الأخيرة',
      nameAr: 'الأمنية الأخيرة',
      description: 'Final wish granted',
      story: "Lina's original wish is fulfilled. Echo gains true freedom.",
      storyAr: 'تتحقق أمنية لينا الأصلية ويصبح إيكو حراً.',
      requirements: ['all wishes completed'],
      unlockCondition: 'all wishes completed',
    },
  ] as ExpandedEnding[],
};
