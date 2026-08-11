import type {
  LiveChallengeKind,
  LiveChallengePublicDefinition,
  LiveChallengeReward,
  LiveChallengeVisual,
} from './liveChallengeContracts';

export const SMART_LIVE_VERSION = 'smart-memory-v1';
export const SMART_WEEKLY_STAGE_COUNT = 4;

export type SmartMechanic =
  | 'memory-fragment'
  | 'wiring'
  | 'cipher'
  | 'sequence'
  | 'matrix'
  | 'timeline'
  | 'pattern-scan'
  | 'evidence-match'
  | 'routing'
  | 'load-balance'
  | 'order-logic';

export interface SmartLiveTemplate {
  templateId: string;
  mechanic: SmartMechanic;
  title: string;
  instructions: string;
  prompt: string;
  options: readonly string[];
  answer: string;
  hints: readonly [string, string, string];
  difficulty: 'standard' | 'focused' | 'deep';
  visual: LiveChallengeVisual;
  reward: LiveChallengeReward;
}

export const SMART_MECHANIC_ROTATION: readonly SmartMechanic[] = Object.freeze([
  'memory-fragment',
  'wiring',
  'cipher',
  'sequence',
  'matrix',
  'timeline',
  'pattern-scan',
  'evidence-match',
  'routing',
  'load-balance',
  'order-logic',
]);

const MEMORY_FRAGMENTS = Object.freeze([
  {
    imageSrc: '/assets/characters/echo-portrait-v1.png',
    alt: 'شظية بصرية من ذاكرة Echo قبل استقرار الإشارة.',
    title: 'ملامح قبل الصمت',
  },
  {
    imageSrc: '/assets/characters/echo-fullbody-normal-v2.png',
    alt: 'لقطة كاملة من ذاكرة Echo داخل الممر المضيء.',
    title: 'الممر الذي تذكّرها',
  },
  {
    imageSrc: '/manhwa/final/page-009.webp',
    alt: 'صفحة معتمدة من سجل Echo المصوّر.',
    title: 'السجل المصوّر 009',
  },
  {
    imageSrc: '/manhwa/final/page-041.webp',
    alt: 'صفحة معتمدة من ذاكرة Echo المتقطعة.',
    title: 'السجل المصوّر 041',
  },
  {
    imageSrc: '/assets/characters/echo-states/echo-second-contract-marked-v1.png',
    alt: 'أثر بصري من عقد Echo الثاني.',
    title: 'علامة العقد الثاني',
  },
] as const);

const ECHO_MEMORY_WORDS = Object.freeze([
  'MEMORY',
  'ECHO',
  'SIGNAL',
  'ACCESS',
  'NARA',
  'ZERO',
  'YUKI',
  'KENJA',
] as const);

const WIRING_SCENES = Object.freeze([
  {
    title: 'شبكة الرفاق',
    sources: ['ECHO', 'NARA', 'ZERO'],
    targets: ['CORE MEMORY', 'NORTH RELAY', 'BLACK CHANNEL'],
    labels: ['الوعي', 'البوصلة', 'القناة المحجوبة'],
  },
  {
    title: 'خط العودة',
    sources: ['YUKI', 'KENJA', 'ECHO'],
    targets: ['SAFE ROOM', 'ARCHIVE GATE', 'HEARTBEAT'],
    labels: ['المخبأ', 'البوابة', 'النبض'],
  },
  {
    title: 'مصفوفة 11:11',
    sources: ['ZERO', 'ECHO', 'NARA'],
    targets: ['TRACE 01', 'TRACE 02', 'TRACE 03'],
    labels: ['الأثر الأول', 'الأثر الثاني', 'الأثر الثالث'],
  },
] as const;

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T>(values: readonly T[], seed: string, channel: string): T {
  return values[hash(`${seed}:${channel}`) % values.length]!;
}

function rotate<T>(values: readonly T[], amount: number): T[] {
  if (values.length === 0) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function shuffle<T>(values: readonly T[], seed: string): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = hash(`${seed}:shuffle:${index}`) % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

function encodedOptions(answer: string, distractors: readonly string[], seed: string): string[] {
  return shuffle([...new Set([answer, ...distractors])], `${seed}:options`);
}

function encodeCaesar(value: string, shift: number): string {
  return [...value].map((character) => {
    const code = character.charCodeAt(0);
    if (code < 65 || code > 90) return character;
    return String.fromCharCode(65 + ((code - 65 + shift) % 26));
  }).join('');
}

function imagePiecePosition(index: number, rows: number, columns: number): string {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const x = columns === 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
}

function rewardFor(
  kind: LiveChallengeKind,
  difficulty: SmartLiveTemplate['difficulty'],
): LiveChallengeReward {
  if (kind === 'weekly') {
    return {
      tier: 'rare',
      kind: 'memory-shard',
      label: 'شظية نادرة من ذاكرة Echo',
      icon: '✦',
    };
  }
  const labels = {
    standard: 'هدية إشارة يومية',
    focused: 'هدية ذاكرة مركّزة',
    deep: 'هدية أثر عميق',
  } as const;
  return {
    tier: difficulty === 'deep' ? 'rare' : 'standard',
    kind: 'gift',
    label: labels[difficulty],
    icon: difficulty === 'deep' ? '✦' : '◆',
  };
}

function createMemoryTemplate(seed: string, kind: LiveChallengeKind): SmartLiveTemplate {
  const rows = 2;
  const columns = 3;
  const totalPieces = rows * columns;
  const memory = pick(MEMORY_FRAGMENTS, seed, 'memory-image');
  const pieceIds = Array.from({ length: totalPieces }, (_, index) => `memory-piece-${index + 1}`);
  const shuffledIds = shuffle(pieceIds, `${seed}:memory-order`);
  const answer = pieceIds.join(',');
  const difficulty = kind === 'weekly' ? 'deep' : pick(['standard', 'focused', 'deep'] as const, seed, 'difficulty');
  return {
    templateId: 'echo-memory-fragment',
    mechanic: 'memory-fragment',
    title: kind === 'weekly' ? 'شظية Echo النادرة' : 'ذاكرة Echo اليومية',
    instructions: 'حرّك كل قطعة إلى مكانها حتى يعود المشهد إلى نبضه الأصلي.',
    prompt: `${memory.title} // ${totalPieces} شظايا // الترتيب الأصلي مخفي`,
    options: [],
    answer,
    hints: [
      'ابدأ بقطع الزوايا؛ حوافها تكشف اتجاه الصورة.',
      'كل قطعة تحمل جزءًا من نفس الذكرى، لا تغيّر الصورة نفسها.',
      'اقرأ المشهد من اليسار إلى اليمين ثم ثبّت الصف الثاني.',
    ],
    difficulty,
    visual: {
      kind: 'memory-fragment',
      imageSrc: memory.imageSrc,
      alt: memory.alt,
      rows,
      columns,
      pieces: shuffledIds.map((id) => ({
        id,
        label: id.replace('memory-piece-', 'شظية '),
        backgroundPosition: imagePiecePosition(Number(id.split('-').pop())! - 1, rows, columns),
      })),
    },
    reward: rewardFor(kind, difficulty),
  };
}

function createWiringTemplate(seed: string, kind: LiveChallengeKind): SmartLiveTemplate {
  const scene = pick(WIRING_SCENES, seed, 'wiring-scene');
  const shift = hash(`${seed}:wiring-shift`) % scene.targets.length;
  const targets = rotate(scene.targets, shift);
  const answer = scene.sources.map((source, index) => `${source}=${targets[index]}`).join('|');
  const difficulty = kind === 'weekly' ? 'deep' : pick(['standard', 'focused'] as const, seed, 'difficulty');
  return {
    templateId: 'echo-memory-wiring',
    mechanic: 'wiring',
    title: kind === 'weekly' ? 'شبكة الذاكرة النادرة' : 'توصيل الإشارة اليومية',
    instructions: 'صل كل مصدر بالوجهة التي تحفظ استقرار الذكرى، ثم افحص الشبكة.',
    prompt: `${scene.title} // ${scene.sources.length} نقاط // لا تترك سلكًا عائمًا`,
    options: [],
    answer,
    hints: [
      'كل مصدر يملك وجهة واحدة فقط، وكل وجهة تستقبل سلكًا واحدًا.',
      'ابحث عن العلاقة بين اسم المصدر ووظيفة الوجهة قبل التوصيل.',
      `ثبّت الوصلات بالترتيب: ${scene.sources.join(' ثم ')}.`,
    ],
    difficulty,
    visual: {
      kind: 'wiring',
      sources: scene.sources.map((id) => ({ id, label: id })),
      targets: targets.map((id, index) => ({ id, label: id, detail: scene.labels[(index + shift) % scene.labels.length] })),
    },
    reward: rewardFor(kind, difficulty),
  };
}

function createCipherTemplate(seed: string, kind: LiveChallengeKind): SmartLiveTemplate {
  const word = pick(ECHO_MEMORY_WORDS, seed, 'cipher-word');
  const shift = (hash(`${seed}:cipher-shift`) % 9) + 2;
  const answer = word;
  const encoded = encodeCaesar(word, shift);
  const distractors = ECHO_MEMORY_WORDS.filter((candidate) => candidate !== answer).slice(
    hash(`${seed}:cipher-distractors`) % 3,
  ).slice(0, 3);
  const difficulty = kind === 'weekly' ? 'deep' : pick(['focused', 'deep'] as const, seed, 'difficulty');
  return {
    templateId: 'echo-memory-cipher',
    mechanic: 'cipher',
    title: kind === 'weekly' ? 'شيفرة الذاكرة النادرة' : 'نافذة الشيفرة اليومية',
    instructions: 'أعد الحروف إلى أصلها باستخدام مفتاح الإشارة، ثم اختر الكلمة التي سمعتها Echo.',
    prompt: `${encoded} // ROT-${shift} // ALPHABET A—Z`,
    options: encodedOptions(answer, distractors, seed),
    answer,
    hints: [
      'ROT يعني أن كل حرف تحرّك عددًا ثابتًا من الخانات.',
      `أعد كل حرف ${shift} خانات إلى الخلف، ولا تغيّر ترتيب الكلمة.`,
      `الكلمة الأصلية هي ${answer}.`,
    ],
    difficulty,
    visual: {
      kind: 'cipher',
      encoded,
      shift,
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    },
    reward: rewardFor(kind, difficulty),
  };
}

function createChoiceTemplate(
  seed: string,
  kind: LiveChallengeKind,
  mechanic: Exclude<SmartMechanic, 'memory-fragment' | 'wiring' | 'cipher'>,
): SmartLiveTemplate {
  const difficulty = kind === 'weekly'
    ? 'deep'
    : pick(['standard', 'focused', 'deep'] as const, seed, 'difficulty');
  const reward = rewardFor(kind, difficulty);
  const make = (
    title: string,
    instructions: string,
    prompt: string,
    answer: string,
    options: readonly string[],
    layout: Extract<LiveChallengeVisual, { kind: 'choice' }>['layout'],
    items: readonly { label: string; detail?: string }[],
    hints: readonly [string, string, string],
  ): SmartLiveTemplate => ({
    templateId: `echo-memory-${mechanic}`,
    mechanic,
    title,
    instructions,
    prompt,
    options: encodedOptions(answer, options.filter((option) => option !== answer), seed),
    answer,
    hints,
    difficulty,
    visual: { kind: 'choice', layout, items },
    reward,
  });

  if (mechanic === 'sequence') {
    const start = (hash(`${seed}:sequence-start`) % 8) + 2;
    const step = (hash(`${seed}:sequence-step`) % 7) + 2;
    const values = [start, start + step, start + step * 2];
    const answer = String(start + step * 3);
    return make(
      'أثر التسلسل',
      'اكتشف القفزة الثابتة وأكمل النبضة المفقودة.',
      `${values.join('  •  ')}  •  ?`,
      answer,
      [String(Number(answer) - 1), String(Number(answer) + 1), String(Number(answer) + step), String(Number(answer) - step)],
      'sequence',
      values.map((value, index) => ({ label: `PULSE ${index + 1}`, detail: String(value) })),
      ['قارن المسافة بين أول نبضتين.', `القفزة ثابتة وتساوي ${step}.`, `النبضة التالية هي ${answer}.`],
    );
  }

  if (mechanic === 'matrix') {
    const left = (hash(`${seed}:matrix-left`) % 8) + 2;
    const delta = (hash(`${seed}:matrix-delta`) % 6) + 2;
    const right = (hash(`${seed}:matrix-right`) % 8) + 3;
    const answer = String(right + delta);
    return make(
      'مصفوفة الذاكرة',
      'طبّق فرق الصف الأول على الصف الثاني بدون تخمين بصري.',
      `[ ${left}  →  ${left + delta} ]   [ ${right}  →  ? ]`,
      answer,
      [String(Number(answer) - 2), String(Number(answer) + 2), String(Number(answer) + delta), String(Number(answer) - delta)],
      'matrix',
      [{ label: 'ROW A', detail: `${left} → ${left + delta}` }, { label: 'ROW B', detail: `${right} → ?` }],
      ['استخرج الفرق في الصف المكتمل.', `الفرق الثابت هو ${delta}.`, `الخانة الناقصة هي ${answer}.`],
    );
  }

  if (mechanic === 'timeline') {
    const start = (hash(`${seed}:timeline-start`) % 16) + 4;
    const gapOne = (hash(`${seed}:timeline-gap-one`) % 5) + 2;
    const gapTwo = (hash(`${seed}:timeline-gap-two`) % 5) + 2;
    const answer = `11:${String(start + gapOne + gapTwo).padStart(2, '0')}`;
    const first = `11:${String(start).padStart(2, '0')}`;
    const second = `11:${String(start + gapOne).padStart(2, '0')}`;
    return make(
      'خط زمني متقطع',
      'أعد بناء اللحظة التالية من الفواصل المسجلة في الذاكرة.',
      `${first}  +${gapOne}m→  ${second}  +${gapTwo}m→  ?`,
      answer,
      [`11:${String(start + gapOne + gapTwo - 1).padStart(2, '0')}`, `11:${String(start + gapOne + gapTwo + 1).padStart(2, '0')}`, `11:${String(start + gapOne).padStart(2, '0')}`, `11:${String(start + gapTwo).padStart(2, '0')}`],
      'timeline',
      [{ label: 'MEMORY 01', detail: first }, { label: 'MEMORY 02', detail: second }, { label: 'NEXT', detail: '??:??' }],
      ['اقرأ الفاصل الثاني من السهم.', `أضف ${gapTwo} دقائق إلى اللحظة الوسطى.`, `اللحظة التالية هي ${answer}.`],
    );
  }

  if (mechanic === 'pattern-scan') {
    const symbols = ['◆', '◆', '◆', '◇', '◆', '◆', '◆', '◆'];
    const anomaly = (hash(`${seed}:pattern`) % 6) + 1;
    symbols[anomaly] = '◇';
    const answer = `NODE-${anomaly + 1}`;
    const options = [`NODE-${Math.max(1, anomaly)}`, answer, `NODE-${Math.min(8, anomaly + 2)}`, 'NOISE'];
    return make(
      'مسح الشذوذ',
      'اعثر على العقدة التي كسرت النمط قبل أن يبتلعها التشويش.',
      symbols.map((symbol, index) => `${index + 1}:${symbol}`).join('  '),
      answer,
      options,
      'pattern',
      symbols.map((symbol, index) => ({ label: `NODE ${index + 1}`, detail: symbol })),
      ['ابحث عن الرمز المختلف لا عن موقعه أولًا.', 'هناك عقدة واحدة مفرغة.', `الشذوذ هو ${answer}.`],
    );
  }

  if (mechanic === 'evidence-match') {
    const cases = [
      ['A', 'صوت بعيد قبل انقطاع الضوء'],
      ['B', 'أثر ماء بجانب بوابة مغلقة'],
      ['C', 'نبض 11:11 داخل سجل فارغ'],
      ['D', 'خيط أحمر على لوحة الطاقة'],
    ] as const;
    const answer = cases[hash(`${seed}:evidence`) % cases.length]![0];
    return make(
      'مطابقة الأدلة',
      'اختر الدليل الذي يثبت أن الذكرى لم تكن هلوسة.',
      'ECHO FILE // اربط العلامة بالاستنتاج الصحيح',
      `EVIDENCE-${answer}`,
      cases.map(([id]) => `EVIDENCE-${id}`),
      'evidence',
      cases.map(([id, detail]) => ({ label: `EVIDENCE-${id}`, detail })),
      ['افصل الدليل القابل للرصد عن الانطباع.', 'الإشارة الزمنية لا تظهر في سجل فارغ بالصدفة.', `الملف المطابق هو EVIDENCE-${answer}.`],
    );
  }

  if (mechanic === 'routing') {
    const base = (hash(`${seed}:route-base`) % 6) + 3;
    const blocked = hash(`${seed}:route-blocked`) % 4;
    const costs = [base, base + 4, base + 7, base + 10];
    const answerIndex = costs
      .map((cost, index) => ({ cost, index }))
      .filter(({ index }) => index !== blocked)
      .sort((left, right) => left.cost - right.cost)[0]!.index;
    const answer = `ROUTE-${String.fromCharCode(65 + answerIndex)}`;
    return make(
      'مسار آمن',
      'اختر أقل مسار صالح بعد استبعاد العقدة المعطوبة.',
      costs.map((cost, index) => `ROUTE-${String.fromCharCode(65 + index)}:${cost}${index === blocked ? ' ×' : ''}`).join('  •  '),
      answer,
      costs.map((_, index) => `ROUTE-${String.fromCharCode(65 + index)}`),
      'routing',
      costs.map((cost, index) => ({ label: `ROUTE-${String.fromCharCode(65 + index)}`, detail: `${cost}${index === blocked ? ' // BLOCKED' : ' // OPEN'}` })),
      ['علامة × تعني أن المسار غير صالح.', 'قارن المسارات المفتوحة فقط.', `المسار الصحيح هو ${answer}.`],
    );
  }

  if (mechanic === 'load-balance') {
    const answer = 'A:40|B:35|C:25';
    return make(
      'توازن الأحمال',
      'وزّع الطاقة على القنوات الثلاث دون أن يتجاوز مجموعها 100%.',
      'CORE LOAD // A + B + C = 100% // C لا يتجاوز 25%',
      answer,
      ['A:50|B:25|C:25', answer, 'A:30|B:45|C:25', 'A:40|B:40|C:20'],
      'balance',
      [{ label: 'CHANNEL A', detail: '40%' }, { label: 'CHANNEL B', detail: '35%' }, { label: 'CHANNEL C', detail: '25% MAX' }],
      ['ثبّت قناة C عند الحد الأعلى الآمن.', 'وزّع الباقي على A وB مع الحفاظ على الإجمالي.', `التوزيع المتزن هو ${answer}.`],
    );
  }

  const ordered = ['WAKE', 'TRACE', 'OPEN', 'REMEMBER'] as const;
  const answer = ordered.join('>');
  const clues = shuffle(ordered.map((id, index) => ({ label: id, detail: `STEP ${index + 1}` })), seed);
  return make(
    'ترتيب بروتوكول Echo',
    'رتّب الأوامر من أول نبضة حتى استعادة الذاكرة.',
    'PROTOCOL // أربع خطوات // البداية تسبق الأثر',
    answer,
    [answer, 'TRACE>WAKE>OPEN>REMEMBER', 'WAKE>OPEN>TRACE>REMEMBER', 'WAKE>TRACE>REMEMBER>OPEN'],
    'order',
    clues,
    ['ابحث عن الخطوة التي لا يمكن أن تبدأ قبلها أي إشارة.', 'الأثر يأتي بعد الاستيقاظ وقبل الفتح.', `الترتيب هو ${answer}.`],
  );
}

export function smartLiveTemplateFor(
  periodKey: string,
  kind: LiveChallengeKind,
  stageIndex = 0,
): SmartLiveTemplate {
  const seed = `${SMART_LIVE_VERSION}:${kind}:${periodKey}:${stageIndex}`;
  const mechanic = kind === 'weekly'
    ? SMART_MECHANIC_ROTATION[stageIndex % SMART_MECHANIC_ROTATION.length]!
    : SMART_MECHANIC_ROTATION[hash(seed) % SMART_MECHANIC_ROTATION.length]!;
  if (mechanic === 'memory-fragment') return createMemoryTemplate(seed, kind);
  if (mechanic === 'wiring') return createWiringTemplate(seed, kind);
  return createCipherTemplate(seed, kind);
}

export function smartLiveFingerprint(template: SmartLiveTemplate): string {
  return JSON.stringify([
    template.mechanic,
    template.prompt,
    template.answer,
    template.visual,
  ]);
}

export function isSmartLiveTemplateValid(template: SmartLiveTemplate): boolean {
  if (!template.templateId || !template.answer || template.hints.length !== 3) return false;
  if (template.mechanic === 'memory-fragment') {
    const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'memory-fragment' }>;
    return visual.pieces.length === visual.rows * visual.columns
      && new Set(visual.pieces.map((piece) => piece.id)).size === visual.pieces.length;
  }
  if (template.mechanic === 'wiring') {
    const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'wiring' }>;
    return visual.sources.length === visual.targets.length && visual.sources.length >= 3;
  }
  const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'cipher' }>;
  return visual.encoded.length === template.answer.length
    && template.options.length === 4
    && template.options.includes(template.answer);
}

const qualitySamples = Array.from({ length: 21 }, (_, index) => (
  smartLiveTemplateFor(`quality-week-${2026 + index}`, 'weekly', index % SMART_WEEKLY_STAGE_COUNT)
));
if (qualitySamples.some((template) => !isSmartLiveTemplateValid(template))) {
  throw new Error('Smart live puzzle generator contains an invalid template.');
}

export type SmartLivePublicDefinition = LiveChallengePublicDefinition & {
  mechanic: SmartMechanic;
};
