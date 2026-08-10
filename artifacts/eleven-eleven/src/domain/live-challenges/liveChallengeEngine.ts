import type { LiveChallengeMechanic } from './liveChallengeContracts';

export const LIVE_CHALLENGE_VERSION = 'live-signal-v1';
export const LIVE_BALANCE_VERSION = 'live-balance-v1';
export const LIVE_RESET_LABEL = '11:11';
export const LIVE_TIMEZONE = 'UTC' as const;

export const LIVE_REWARD_CONFIG = Object.freeze({
  dailyXp: 25,
  dailyCoins: 25,
  dailyPerfectXpBonus: 5,
  dailyPerfectCoinsBonus: 10,
  weeklyTrialXp: 100,
  weeklyTrialCoins: 100,
  weeklyRecoveryXp: 100,
  weeklyRecoveryCoins: 100,
  weeklyPerfectBonusCoins: 25,
});

export const LIVE_HINT_COSTS = Object.freeze([0, 12, 24] as const);

export interface LiveTemplate {
  mechanic: LiveChallengeMechanic;
  title: string;
  instructions: string;
  prompt: string;
  options: readonly string[];
  answer: string;
  hints: readonly string[];
}

/** Small, authored system templates. They are not Canon, story content, or AI output. */
export const LIVE_TEMPLATE_POOL: readonly LiveTemplate[] = Object.freeze([
  {
    mechanic: 'signal',
    title: 'SIGNAL CALIBRATION',
    instructions: 'اختر القناة التي تحمل توقيع 11:11.',
    prompt: 'SIGNAL // 07-A   11:11   13-C',
    options: ['07-A', '11:11', '13-C'],
    answer: '11:11',
    hints: ['ابحث عن التوقيع المرتبط بالنظام.', 'التوقيع الأوسط هو الإشارة النشطة.'],
  },
  {
    mechanic: 'sequence',
    title: 'SEQUENCE TRACE',
    instructions: 'أكمل النمط الحسابي ثم ثبّت الإشارة.',
    prompt: '2  •  4  •  8  •  ?',
    options: ['10', '12', '16'],
    answer: '16',
    hints: ['كل قيمة تتضاعف.', 'الخطوة التالية بعد 8 هي 16.'],
  },
  {
    mechanic: 'cipher',
    title: 'CIPHER WINDOW',
    instructions: 'اختر المفتاح الذي يطابق إزاحة النظام.',
    prompt: '11:11 // SHIFT +0 // KEY ?',
    options: ['ECHO', 'SIGNAL', 'NULL'],
    answer: 'SIGNAL',
    hints: ['الإشارة غير المشوشة لا تحتاج إزاحة.', 'المفتاح هو قناة النظام.'],
  },
  {
    mechanic: 'wiring',
    title: 'LINK ROUTING',
    instructions: 'أوصل العقدة الحمراء إلى بوابة الاستقرار.',
    prompt: 'RED NODE → ?',
    options: ['ARCHIVE', 'STABLE', 'VOID'],
    answer: 'STABLE',
    hints: ['لا تمرر الطاقة إلى الفراغ.', 'بوابة الاستقرار هي الوجهة الصحيحة.'],
  },
  {
    mechanic: 'matrix',
    title: 'MATRIX SCAN',
    instructions: 'حدد الخلية التي تكمل قطر الإشارة.',
    prompt: '[A1] [B2] [C3] [ ? ]',
    options: ['D4', 'A4', 'C1'],
    answer: 'D4',
    hints: ['كل زوج يتحرك خطوة على القطر.', 'الخلية التالية تحمل الرقم 4.'],
  },
]);

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function chooseRotatingTemplate(
  seed: string,
  previousMechanic?: LiveChallengeMechanic,
): LiveTemplate {
  const initial = stableHash(seed) % LIVE_TEMPLATE_POOL.length;
  const candidate = LIVE_TEMPLATE_POOL[initial]!;
  if (!previousMechanic || candidate.mechanic !== previousMechanic) return candidate;
  return LIVE_TEMPLATE_POOL[(initial + 1) % LIVE_TEMPLATE_POOL.length]!;
}

export function isLiveAnswerCorrect(answer: string, expected: string): boolean {
  return answer.trim().toLocaleUpperCase() === expected.toLocaleUpperCase();
}

export function validateLiveTemplate(template: LiveTemplate): boolean {
  return template.options.length >= 2
    && template.options.includes(template.answer)
    && template.hints.length === 2
    && template.hints.every((hint) => hint.length > 0);
}

if (LIVE_TEMPLATE_POOL.some((template) => !validateLiveTemplate(template))) {
  throw new Error('Live challenge template pool contains an unsolvable definition.');
}
