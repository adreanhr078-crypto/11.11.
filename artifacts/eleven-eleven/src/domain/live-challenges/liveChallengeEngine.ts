type LegacyLiveMechanic =
  | 'signal'
  | 'sequence'
  | 'cipher'
  | 'wiring'
  | 'matrix'
  | 'pattern'
  | 'timeline'
  | 'logic'
  | 'checksum'
  | 'routing';

// Period IDs remain stable so a mid-window quality upgrade cannot create a
// second attempt or duplicate reward for the same player/day. Existing cached
// windows finish with their original definition; new windows use this engine.
// The live route now uses the smart memory generator. The legacy template
// helpers below remain available to isolated compatibility tests only.
export const LIVE_CHALLENGE_VERSION = 'smart-memory-v1';
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
  dailyXpByDifficulty: Object.freeze({ standard: 25, focused: 35, deep: 50 }),
  dailyCoinsByDifficulty: Object.freeze({ standard: 25, focused: 40, deep: 60 }),
});

export const LIVE_HINT_COSTS = Object.freeze([0, 12, 24] as const);

export interface LiveTemplate {
  templateId: string;
  mechanic: LegacyLiveMechanic;
  title: string;
  instructions: string;
  prompt: string;
  options: readonly string[];
  answer: string;
  hints: readonly [string, string, string];
}

type LiveTemplateFactory = (seed: string, variant: number) => LiveTemplate;

export const LIVE_MECHANIC_ROTATION: readonly LegacyLiveMechanic[] = Object.freeze([
  'signal',
  'sequence',
  'cipher',
  'wiring',
  'matrix',
  'pattern',
  'timeline',
  'logic',
  'checksum',
  'routing',
]);

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNumber(seed: string, channel: string, minimum: number, span: number): number {
  return minimum + (stableHash(`${seed}:${channel}`) % span);
}

function variantNumber(
  variant: number,
  divisor: number,
  minimum: number,
  span: number,
): number {
  return minimum + (Math.floor(variant / divisor) % span);
}

function rotate<T>(values: readonly T[], amount: number): T[] {
  if (values.length === 0) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function optionsFor(seed: string, answer: string, distractors: readonly string[]): string[] {
  return rotate([...new Set([answer, ...distractors])], stableHash(`${seed}:options`));
}

function encodeCaesar(value: string, shift: number): string {
  return [...value].map((character) => {
    const code = character.charCodeAt(0);
    if (code < 65 || code > 90) return character;
    return String.fromCharCode(65 + ((code - 65 + shift) % 26));
  }).join('');
}

const LIVE_TEMPLATE_FACTORIES: Readonly<Record<LegacyLiveMechanic, LiveTemplateFactory>> = {
  signal(seed, variant) {
    const target = variantNumber(variant, 1, 46, 37);
    const drift = variantNumber(variant, 37, 2, 7);
    const answer = `${target} Hz`;
    return {
      templateId: 'signal-frequency-lock',
      mechanic: 'signal',
      title: 'FREQUENCY LOCK',
      instructions: 'ثبّت التردد المطابق لمعامل المزامنة الظاهر في النواة.',
      prompt: `CORE 11:11 // SYNC ${target} // DRIFT ±${drift}`,
      options: optionsFor(seed, answer, [`${target - 4} Hz`, `${target + 3} Hz`]),
      answer,
      hints: [
        'قيمة SYNC هي مركز الإشارة وليست قيمة الانحراف.',
        `تجاهل DRIFT وثبّت مركز القناة عند ${target}.`,
        `الإجابة الصحيحة هي ${answer}.`,
      ],
    };
  },
  sequence(seed, variant) {
    const start = variantNumber(variant, 1, 2, 8);
    const step = variantNumber(variant, 8, 3, 7);
    const values = [start, start + step, start + (step * 2)];
    const answer = String(start + (step * 3));
    return {
      templateId: 'sequence-step-trace',
      mechanic: 'sequence',
      title: 'SEQUENCE TRACE',
      instructions: 'استخرج مقدار القفزة الثابتة وأكمل النبضة الرابعة.',
      prompt: `${values.join('  •  ')}  •  ?`,
      options: optionsFor(seed, answer, [String(Number(answer) - 1), String(Number(answer) + step)]),
      answer,
      hints: [
        'اطرح أول قيمتين لاكتشاف مقدار القفزة.',
        `كل نبضة تزيد بمقدار ${step}.`,
        `النبضة التالية هي ${answer}.`,
      ],
    };
  },
  cipher(seed, variant) {
    const words = ['SIGNAL', 'MEMORY', 'ACCESS', 'ECHO', 'CORE'] as const;
    const word = words[variantNumber(variant, 1, 0, words.length)]!;
    const shift = variantNumber(variant, words.length, 1, 13);
    const encoded = encodeCaesar(word, shift);
    return {
      templateId: 'cipher-caesar-window',
      mechanic: 'cipher',
      title: 'CIPHER WINDOW',
      instructions: 'أعد كل حرف للخلف حسب قيمة SHIFT ثم اختر الكلمة الأصلية.',
      prompt: `${encoded} // SHIFT -${shift}`,
      options: optionsFor(seed, word, words.filter((candidate) => candidate !== word).slice(0, 3)),
      answer: word,
      hints: [
        'حرّك كل حرف للخلف في الأبجدية الإنجليزية.',
        `قيمة الإزاحة هي ${shift} خانات.`,
        `النص الأصلي هو ${word}.`,
      ],
    };
  },
  wiring(seed, variant) {
    const load = variantNumber(variant, 1, 45, 26);
    const safeCapacity = load + variantNumber(variant, 26, 4, 7);
    const capacities = [load - 7, safeCapacity, safeCapacity + 12];
    const labels = rotate(['A', 'B', 'C'], stableHash(`${seed}:wire-label`));
    const answer = `LINK-${labels[1]}`;
    return {
      templateId: 'wiring-minimum-safe-link',
      mechanic: 'wiring',
      title: 'LOAD ROUTING',
      instructions: 'اختر أصغر وصلة تتحمل الحمل دون زيادة غير ضرورية.',
      prompt: `LOAD ${load} // ${labels.map((label, index) => `${label}:${capacities[index]}`).join('  ')}`,
      options: optionsFor(seed, answer, labels.filter((label) => label !== labels[1]).map((label) => `LINK-${label}`)),
      answer,
      hints: [
        'استبعد الوصلة الأقل من الحمل أولًا.',
        'من الوصلات الآمنة اختر الأقل سعة.',
        `الوصلة المتوازنة هي ${answer}.`,
      ],
    };
  },
  matrix(seed, variant) {
    const a = variantNumber(variant, 1, 2, 7);
    const b = variantNumber(variant, 7, 2, 7);
    const c = a + variantNumber(variant, 49, 2, 6);
    const answer = String(b + (c - a));
    return {
      templateId: 'matrix-row-delta',
      mechanic: 'matrix',
      title: 'MATRIX SCAN',
      instructions: 'طبّق فرق الصف العلوي نفسه على الصف السفلي.',
      prompt: `[ ${a}  →  ${c} ]   [ ${b}  →  ? ]`,
      options: optionsFor(seed, answer, [String(Number(answer) - 2), String(Number(answer) + 2)]),
      answer,
      hints: [
        'احسب الفرق بين الخليتين في الصف الأول.',
        `الفرق الثابت هو ${c - a}.`,
        `الخلية الناقصة هي ${answer}.`,
      ],
    };
  },
  pattern(seed, variant) {
    const symbolPairs = [
      ['◆', '◇'],
      ['●', '○'],
      ['■', '□'],
      ['▲', '△'],
      ['⬢', '⬡'],
      ['✦', '✧'],
    ] as const;
    const size = 9;
    const anomalyIndex = variantNumber(variant, 1, 1, size - 2);
    const [normalSymbol, anomalySymbol] = symbolPairs[
      variantNumber(variant, size - 2, 0, symbolPairs.length)
    ]!;
    const nodes = Array.from({ length: size }, (_, index) => (
      index === anomalyIndex ? anomalySymbol : normalSymbol
    ));
    const answer = `NODE-${anomalyIndex + 1}`;
    return {
      templateId: 'pattern-single-anomaly',
      mechanic: 'pattern',
      title: 'ANOMALY SWEEP',
      instructions: 'حدد العقدة الوحيدة التي تعكس نمط النبض.',
      prompt: nodes.map((node, index) => `${index + 1}:${node}`).join('  '),
      options: optionsFor(seed, answer, [`NODE-${Math.max(1, anomalyIndex)}`, `NODE-${Math.min(size, anomalyIndex + 2)}`]),
      answer,
      hints: [
        'قارن تعبئة الرموز لا أرقامها.',
        'هناك رمز مفرغ واحد بين رموز ممتلئة.',
        `الشذوذ عند ${answer}.`,
      ],
    };
  },
  timeline(seed, variant) {
    const minute = variantNumber(variant, 1, 3, 30);
    const firstGap = variantNumber(variant, 30, 2, 5);
    const secondGap = variantNumber(variant, 150, 2, 5);
    const answer = `11:${String(minute + firstGap + secondGap).padStart(2, '0')}`;
    const first = `11:${String(minute).padStart(2, '0')}`;
    const second = `11:${String(minute + firstGap).padStart(2, '0')}`;
    return {
      templateId: 'timeline-interval-recovery',
      mechanic: 'timeline',
      title: 'TIMELINE RECOVERY',
      instructions: 'أكمل الطابع الزمني باستخدام الفاصلين المسجلين.',
      prompt: `${first}  +${firstGap}m→  ${second}  +${secondGap}m→  ?`,
      options: optionsFor(seed, answer, [`11:${String(minute + firstGap + secondGap - 1).padStart(2, '0')}`, `11:${String(minute + firstGap + secondGap + 2).padStart(2, '0')}`]),
      answer,
      hints: [
        'أضف الفاصل الثاني إلى الطابع الأوسط.',
        `الفاصل الأخير يساوي ${secondGap} دقائق.`,
        `الطابع التالي هو ${answer}.`,
      ],
    };
  },
  logic(seed, variant) {
    const nodePermutations = [
      ['ALPHA', 'BETA', 'GAMMA'],
      ['ALPHA', 'GAMMA', 'BETA'],
      ['BETA', 'ALPHA', 'GAMMA'],
      ['BETA', 'GAMMA', 'ALPHA'],
      ['GAMMA', 'ALPHA', 'BETA'],
      ['GAMMA', 'BETA', 'ALPHA'],
    ] as const;
    const conditions = [
      ['CYAN', 'ON', 'RED', 'OFF'],
      ['AMBER', 'ARMED', 'GRAY', 'SAFE'],
      ['VIOLET', 'OPEN', 'RED', 'SEALED'],
      ['WHITE', 'STABLE', 'AMBER', 'UNSTABLE'],
      ['BLUE', 'LINKED', 'GRAY', 'ISOLATED'],
      ['GREEN', 'VERIFIED', 'RED', 'REJECTED'],
      ['GOLD', 'SYNCED', 'BLUE', 'DRIFTING'],
    ] as const;
    const nodes = nodePermutations[variantNumber(variant, 1, 0, nodePermutations.length)]!;
    const [targetTone, targetState, decoyTone, decoyState] = conditions[
      variantNumber(variant, 6, 0, conditions.length)
    ]!;
    const answer = nodes[1]!;
    return {
      templateId: 'logic-exclusive-node',
      mechanic: 'logic',
      title: 'LOGIC LOCK',
      instructions: `اختر العقدة التي تجمع ${targetTone} و${targetState} معًا.`,
      prompt: `${nodes[0]}: ${decoyTone}/${targetState}  •  ${nodes[1]}: ${targetTone}/${targetState}  •  ${nodes[2]}: ${targetTone}/${decoyState}`,
      options: optionsFor(seed, answer, [nodes[0]!, nodes[2]!]),
      answer,
      hints: [
        'الخاصية الأولى وحدها لا تكفي؛ افحص حالة العقدة أيضًا.',
        `المطلوب عقدة ${targetTone} وحالتها ${targetState} في الوقت نفسه.`,
        `العقدة المطابقة هي ${answer}.`,
      ],
    };
  },
  checksum(seed, variant) {
    const digits = [
      variantNumber(variant, 1, 1, 9),
      variantNumber(variant, 9, 1, 9),
      variantNumber(variant, 81, 1, 9),
    ];
    const answer = String(digits.reduce((sum, digit) => sum + digit, 0) % 11);
    return {
      templateId: 'checksum-modulo-eleven',
      mechanic: 'checksum',
      title: 'CHECKSUM 11',
      instructions: 'اجمع الأرقام ثم خذ باقي القسمة على 11.',
      prompt: `${digits.join(' + ')} // MOD 11 = ?`,
      options: optionsFor(seed, answer, [String((Number(answer) + 1) % 11), String((Number(answer) + 9) % 11)]),
      answer,
      hints: [
        'ابدأ بجمع القيم الثلاث.',
        'اطرح 11 من المجموع حتى يصبح بين 0 و10.',
        `قيمة التحقق هي ${answer}.`,
      ],
    };
  },
  routing(seed, variant) {
    const baseCost = variantNumber(variant, 1, 4, 10);
    const costs = rotate([
      baseCost,
      baseCost + variantNumber(variant, 10, 2, 4),
      baseCost + variantNumber(variant, 40, 6, 5),
    ], stableHash(`${seed}:route-order`));
    const blockedIndex = stableHash(`${seed}:blocked`) % costs.length;
    const available = costs
      .map((cost, index) => ({ cost, index }))
      .filter((route) => route.index !== blockedIndex)
      .sort((left, right) => left.cost - right.cost || left.index - right.index);
    const answer = `ROUTE-${String.fromCharCode(65 + available[0]!.index)}`;
    const routeLabels = costs.map((cost, index) => (
      `${String.fromCharCode(65 + index)}:${cost}${index === blockedIndex ? '×' : ''}`
    ));
    return {
      templateId: 'routing-lowest-safe-cost',
      mechanic: 'routing',
      title: 'SAFE ROUTE',
      instructions: 'تجنب المسار المعطوب واختر أقل كلفة متاحة.',
      prompt: routeLabels.join('  •  '),
      options: optionsFor(seed, answer, ['ROUTE-A', 'ROUTE-B', 'ROUTE-C'].filter((option) => option !== answer)),
      answer,
      hints: [
        'علامة × تعني أن المسار غير صالح مهما كانت كلفته.',
        'قارن الكلفة بين المسارين المتبقيين فقط.',
        `المسار الآمن الأقل كلفة هو ${answer}.`,
      ],
    };
  },
};

function createTemplateForMechanic(
  seed: string,
  mechanic: LegacyLiveMechanic,
  variant = stableHash(seed),
): LiveTemplate {
  const template = LIVE_TEMPLATE_FACTORIES[mechanic](seed, variant);
  const frame = stableHash(`${seed}:challenge-frame`)
    .toString(36)
    .toUpperCase()
    .padStart(7, '0');
  return {
    ...template,
    // The frame is generated from the server period and is part of the data
    // packet being solved. Together with varied operands, it prevents an
    // exact challenge instance from silently recurring in long rotations.
    prompt: `${template.prompt} // FRAME ${frame}`,
  };
}

/**
 * Slot-based rotation guarantees ten different mechanics before one can
 * recur. Seeded values then make every challenge instance materially unique.
 */
export function createLiveTemplateForSlot(seed: string, slot: number): LiveTemplate {
  const normalizedSlot = Number.isSafeInteger(slot) ? Math.abs(slot) : 0;
  const mechanic = LIVE_MECHANIC_ROTATION[normalizedSlot % LIVE_MECHANIC_ROTATION.length]!;
  const variant = Math.floor(normalizedSlot / LIVE_MECHANIC_ROTATION.length);
  return createTemplateForMechanic(seed, mechanic, variant);
}

/** Backward-compatible deterministic selector used by isolated engine callers. */
export function chooseRotatingTemplate(
  seed: string,
  previousMechanic?: LegacyLiveMechanic,
): LiveTemplate {
  const initial = stableHash(seed) % LIVE_MECHANIC_ROTATION.length;
  const mechanic = LIVE_MECHANIC_ROTATION.find((candidate, index) => (
    index >= initial && candidate !== previousMechanic
  )) ?? LIVE_MECHANIC_ROTATION.find((candidate) => candidate !== previousMechanic)
    ?? LIVE_MECHANIC_ROTATION[0]!;
  return createTemplateForMechanic(seed, mechanic);
}

export function liveTemplateFingerprint(template: LiveTemplate): string {
  return JSON.stringify([
    template.mechanic,
    template.prompt,
    [...template.options].sort(),
    template.answer,
  ]);
}

export function liveTemplateMaterialFingerprint(template: LiveTemplate): string {
  return JSON.stringify([
    template.mechanic,
    template.prompt.replace(/ \/\/ FRAME [A-Z0-9]+$/, ''),
    [...template.options].sort(),
    template.answer,
  ]);
}

export const LIVE_TEMPLATE_POOL: readonly LiveTemplate[] = Object.freeze(
  LIVE_MECHANIC_ROTATION.map((_, index) => (
    createLiveTemplateForSlot(`quality-reference:${index}`, index)
  )),
);

export function isLiveAnswerCorrect(answer: string, expected: string): boolean {
  return answer.trim().toLocaleUpperCase() === expected.toLocaleUpperCase();
}

export function validateLiveTemplate(template: LiveTemplate): boolean {
  return template.templateId.length > 0
    && template.options.length >= 3
    && new Set(template.options).size === template.options.length
    && template.options.includes(template.answer)
    && template.hints.length === 3
    && template.hints.every((hint) => hint.trim().length > 0);
}

if (LIVE_TEMPLATE_POOL.some((template) => !validateLiveTemplate(template))) {
  throw new Error('Live challenge template pool contains an unsolvable definition.');
}
