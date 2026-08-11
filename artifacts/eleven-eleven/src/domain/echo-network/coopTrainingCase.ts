import type { CoopRole, LocalizedCopy } from './contracts';
import { COOP_CASE_BY_ID, COOP_TRAINING_CASE_ID } from './coopCaseCatalog';

/**
 * The sole client-visible solution is an explicitly rewardless tutorial.
 * Online cases receive role clues and validation only from the Realtime Worker.
 */
export const COOP_TRAINING_ANSWERS = Object.freeze(['east', 'echo', '11-11'] as const);

const exclusions: readonly Readonly<Record<CoopRole, string>>[] = [
  { memory: 'north', cipher: 'south', route: 'west', anchor: 'combine' },
  { memory: 'memory', cipher: 'access', route: 'signal', anchor: 'combine' },
  { memory: '11-01', cipher: '01-11', route: '00-11', anchor: 'combine' },
];

export function coopTrainingClue(stageIndex: number, role: CoopRole): LocalizedCopy {
  if (role === 'anchor') {
    return {
      ar: 'اجمعوا استبعادات الأدوار، ثم اختاروا الرمز الوحيد المتبقي.',
      en: 'Combine every role’s exclusion, then choose the only remaining symbol.',
    };
  }
  const excluded = exclusions[stageIndex]?.[role] ?? '';
  const label = COOP_CASE_BY_ID[COOP_TRAINING_CASE_ID]
    ?.stages[stageIndex]?.optionLabels[excluded];
  return {
    ar: `قناتك تستبعد «${label?.ar ?? excluded}». شارك هذه المعلومة مع Echo.`,
    en: `Your channel rules out “${label?.en ?? excluded}.” Share that with Echo.`,
  };
}
