import type { CoopRole, LocalizedCopy } from '../../../src/domain/echo-network/contracts';
import { COOP_CASE_BY_ID } from '../../../src/domain/echo-network/coopCaseCatalog';

interface CoopSolution {
  answers: readonly [string, string, string];
}

const SOLUTIONS: Readonly<Record<string, CoopSolution>> = Object.freeze({
  'coop-warm-signal': { answers: ['east', 'echo', '11-11'] },
  'coop-broken-window': { answers: ['north', 'memory', '11-01'] },
  'coop-first-contract': { answers: ['west', 'access', '01-11'] },
  'coop-nara-farewell': { answers: ['south', 'memory', '00-11'] },
  'coop-red-circuit': { answers: ['east', 'signal', '11-01'] },
  'coop-silent-key': { answers: ['north', 'access', '11-11'] },
  'coop-kenja-record': { answers: ['west', 'echo', '00-11'] },
  'coop-zero-route': { answers: ['south', 'signal', '01-11'] },
  'coop-mirror-memory': { answers: ['east', 'memory', '00-11'] },
  'coop-lina-protocol': { answers: ['north', 'access', '01-11'] },
  'coop-black-coronation': { answers: ['west', 'echo', '11-01'] },
  'coop-echo-fracture': { answers: ['south', 'signal', '11-11'] },
});

const ROLE_ORDER: readonly CoopRole[] = ['memory', 'cipher', 'route', 'anchor'];

function copy(ar: string, en: string): LocalizedCopy {
  return { ar, en };
}

export function coopAnswer(caseId: string, stageIndex: number): string | null {
  return SOLUTIONS[caseId]?.answers[stageIndex] ?? null;
}

export function coopRoleClue(
  caseId: string,
  stageIndex: number,
  role: CoopRole,
): LocalizedCopy | null {
  const definition = COOP_CASE_BY_ID[caseId];
  const answer = coopAnswer(caseId, stageIndex);
  const options = definition?.stages[stageIndex]?.optionIds;
  if (!answer || !options?.includes(answer)) return null;
  const wrong = options.filter((option) => option !== answer);
  if (role === 'anchor') {
    return copy(
      'مرساة Echo: بعد جمع الاستبعادات الثلاثة، ثبّتوا الخيار الوحيد المتبقي.',
      'Echo anchor: combine all three exclusions, then lock the only remaining option.',
    );
  }
  const excluded = wrong[ROLE_ORDER.indexOf(role)] ?? wrong[0];
  const label = definition.stages[stageIndex]?.optionLabels[excluded];
  if (!label) return null;
  return copy(
    `قناتي تستبعد «${label.ar}» قطعًا.`,
    `My channel definitively rules out “${label.en}”.`,
  );
}

export function coopHint(
  caseId: string,
  stageIndex: number,
  hintLevel: number,
): LocalizedCopy | null {
  const definition = COOP_CASE_BY_ID[caseId];
  const answer = coopAnswer(caseId, stageIndex);
  const options = definition?.stages[stageIndex]?.optionIds;
  if (!answer || !options?.includes(answer) || hintLevel < 1) return null;
  const excludedId = options
    .filter((option) => option !== answer)
    [Math.min(hintLevel - 1, options.length - 2)];
  const excluded = excludedId
    ? definition.stages[stageIndex]?.optionLabels[excludedId]
    : null;
  if (!excluded) return null;
  return copy(
    `تحليل Echo ${hintLevel}/3: الإشارة «${excluded.ar}» متعارضة مع سجل القضية؛ استبعدوها.`,
    `Echo analysis ${hintLevel}/3: “${excluded.en}” conflicts with the case record; rule it out.`,
  );
}

export function assignCoopRoles(index: number, partySize: number): readonly CoopRole[] {
  if (partySize <= 2) {
    return index === 0 ? ['memory', 'route'] : ['cipher', 'anchor'];
  }
  if (partySize === 3) {
    if (index === 0) return ['memory'];
    if (index === 1) return ['cipher'];
    return ['route', 'anchor'];
  }
  return [ROLE_ORDER[Math.min(index, ROLE_ORDER.length - 1)]!];
}

export function isReviewedCoopCase(caseId: string): boolean {
  const solution = SOLUTIONS[caseId];
  const definition = COOP_CASE_BY_ID[caseId];
  return Boolean(
    solution
    && definition
    && solution.answers.every((answer, index) => (
      definition.stages[index]?.optionIds.includes(answer)
    )),
  );
}
