import type {
  LiveChallengeKind,
  LiveChallengePublicDefinition,
  LiveChallengeReward,
  LiveChallengeVisual,
} from './liveChallengeContracts';
import { FINAL_MANHWA_ASSET_ROOT } from '../../content/manhwa/finalManhwa';
import { WEEKLY_REWARD_PREVIEW } from './weeklyRewardCatalog';

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
  | 'order-logic'
  | 'text-riddle'
  | 'symbol-pair'
  | 'spatial-rotation'
  | 'word-path';

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
  'text-riddle',
  'symbol-pair',
  'spatial-rotation',
  'word-path',
]);

/** Only pages released in the corrected opening slice may frame live puzzles. */
const MEMORY_FRAGMENTS = Object.freeze([
  {
    imageSrc: `${FINAL_MANHWA_ASSET_ROOT}/page-007.webp`,
    alt: 'شظية بصرية من افتتاح مانهوَا Echo Network المصححة.',
    title: 'نبض الافتتاح 007',
  },
  {
    imageSrc: `${FINAL_MANHWA_ASSET_ROOT}/page-009.webp`,
    alt: 'شظية بصرية من بوابة الأرشيف في الافتتاح المصحح.',
    title: 'بوابة الأرشيف 009',
  },
] as const);

const ECHO_MEMORY_WORDS = Object.freeze([
  'MEMORY',
  'ECHO',
  'SIGNAL',
  'ACCESS',
  'TRACE',
  'ARCHIVE',
  'RELAY',
  'GATE',
] as const);

const WIRING_SCENES = Object.freeze([
  {
    title: 'شبكة الإشارات',
    sources: ['ECHO', 'SIGNAL', 'TRACE'],
    targets: ['CORE MEMORY', 'NORTH RELAY', 'ARCHIVE GATE'],
    labels: ['الوعي', 'المرحل', 'بوابة الأرشيف'],
    signatures: ['11·C', '07·R', '09·A'],
  },
  {
    title: 'خط العودة',
    sources: ['ACCESS', 'ARCHIVE', 'ECHO'],
    targets: ['SAFE ROOM', 'ARCHIVE GATE', 'HEARTBEAT'],
    labels: ['الممر الآمن', 'البوابة', 'النبض'],
    signatures: ['07·S', '09·A', '11·H'],
  },
  {
    title: 'مصفوفة 11:11',
    sources: ['SIGNAL', 'ECHO', 'TRACE'],
    targets: ['TRACE 01', 'TRACE 02', 'TRACE 03'],
    labels: ['الأثر الأول', 'الأثر الثاني', 'الأثر الثالث'],
    signatures: ['S·01', 'E·02', 'T·03'],
  },
].map((scene) => Object.freeze(scene)) as readonly {
  readonly title: string;
  readonly sources: readonly string[];
  readonly targets: readonly string[];
  readonly labels: readonly string[];
  readonly signatures: readonly string[];
}[]);

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

function fourOptions(answer: string, candidates: readonly string[], seed: string): string[] {
  const unique = [...new Set([answer, ...candidates])];
  const filled = [...unique];
  let index = 0;
  const safeFallbacks = ['إشارة غير مستقرة', 'مسار محجوب', 'بيانات ناقصة', 'لا يوجد تطابق'];
  while (filled.length < 4) {
    const decoy = safeFallbacks[index % safeFallbacks.length]!;
    if (!filled.includes(decoy)) filled.push(decoy);
    index += 1;
  }
  return shuffle([answer, ...filled.filter((option) => option !== answer).slice(0, 3)], `${seed}:four-options`);
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
    return WEEKLY_REWARD_PREVIEW;
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
  const tokenPool = shuffle(['A', 'C', 'E', 'K', 'N', 'Z'], `${seed}:memory-tokens`);
  const canonicalPieces = Array.from({ length: totalPieces }, (_, index) => ({
    id: `fragment-${tokenPool[index]}`,
    label: `شظية ${tokenPool[index]}`,
    backgroundPosition: imagePiecePosition(index, rows, columns),
  }));
  const shuffledPieces = shuffle(canonicalPieces, `${seed}:memory-order`);
  const pieceIds = canonicalPieces.map((piece) => piece.id);
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
      pieces: shuffledPieces,
    },
    reward: rewardFor(kind, difficulty),
  };
}

function createWiringTemplate(seed: string, kind: LiveChallengeKind): SmartLiveTemplate {
  const scene = pick(WIRING_SCENES, seed, 'wiring-scene');
  const targetIndices = shuffle(scene.targets.map((_, index) => index), `${seed}:wiring-order`);
  const answer = scene.sources.map((source, index) => `${source}=${scene.targets[index]}`).join('|');
  const difficulty = kind === 'weekly' ? 'deep' : pick(['standard', 'focused'] as const, seed, 'difficulty');
  return {
    templateId: 'echo-memory-wiring',
    mechanic: 'wiring',
    title: kind === 'weekly' ? 'شبكة الذاكرة النادرة' : 'توصيل الإشارة اليومية',
    instructions: 'صل كل مصدر بالوجهة التي تحمل توقيع المعايرة نفسه. كل وجهة تقبل سلكًا واحدًا فقط.',
    prompt: `${scene.title} // طابق التوقيعات المتطابقة // لا تترك سلكًا عائمًا`,
    options: [],
    answer,
    hints: [
      'كل مصدر يملك وجهة واحدة فقط، وكل وجهة تستقبل سلكًا واحدًا.',
      'اقرأ الرمز الصغير بجانب المصدر ثم ابحث عن الرمز نفسه في الجهة المقابلة.',
      `ابدأ بالتوقيع ${scene.signatures[0]} ثم أكمل البقية.`,
    ],
    difficulty,
    visual: {
      kind: 'wiring',
      sources: scene.sources.map((id, index) => ({ id, label: id, signature: scene.signatures[index] })),
      targets: targetIndices.map((index) => ({
        id: scene.targets[index]!,
        label: scene.targets[index]!,
        detail: scene.labels[index]!,
        signature: scene.signatures[index]!,
      })),
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
    options: fourOptions(answer, options.filter((option) => option !== answer), seed),
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
    const symbols = Array.from({ length: 8 }, () => '◆');
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
      ['A', 'شاهدان سجلا الصوت نفسه قبل انقطاع الضوء'],
      ['B', 'أثر ماء مادي بجانب بوابة مغلقة'],
      ['C', 'نبض 11:11 بتوقيع زمني داخل سجل الخادم'],
      ['D', 'خيط طاقة أحمر يصل اللوحة بالقناة السوداء'],
    ] as const;
    const investigations = [
      { answer: 'A', goal: 'الدليل السمعي المؤكد بأكثر من شاهد', clue: 'ابحث عن تسجيل سمعي تؤكده ملاحظتان مستقلتان.' },
      { answer: 'B', goal: 'الأثر المادي الموجود عند البوابة', clue: 'المطلوب أثر يمكن لمسه وموقعه محدد عند بوابة.' },
      { answer: 'C', goal: 'السجل الرقمي الذي يثبت لحظة 11:11', clue: 'الطابع الزمني داخل سجل الخادم هو الفاصل.' },
      { answer: 'D', goal: 'الدليل الذي يربط الطاقة بالقناة السوداء', clue: 'تتبّع الوصلة الحمراء بين نقطتين.' },
    ] as const;
    const investigation = pick(investigations, seed, 'evidence-goal');
    const answer = investigation.answer;
    return make(
      'مطابقة الأدلة',
      `اختر ${investigation.goal}.`,
      `ECHO FILE // الهدف: ${investigation.goal}`,
      `EVIDENCE-${answer}`,
      cases.map(([id]) => `EVIDENCE-${id}`),
      'evidence',
      cases.map(([id, detail]) => ({ label: `EVIDENCE-${id}`, detail })),
      ['اقرأ الهدف أولًا ثم استبعد الأدلة من الأنواع الأخرى.', investigation.clue, `الملف المطابق هو EVIDENCE-${answer}.`],
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
      'اختر التوزيع الوحيد الذي يحقق القيود الثلاثة معًا.',
      'CORE LOAD // المجموع 100% // A=40% // B أعلى من C بعشر نقاط',
      answer,
      ['A:50|B:25|C:25', answer, 'A:30|B:45|C:25', 'A:40|B:40|C:20'],
      'balance',
      [{ label: 'TOTAL', detail: '100%' }, { label: 'CHANNEL A', detail: '40% ثابت' }, { label: 'RELATION', detail: 'B = C + 10' }],
      ['استبعد أي خيار لا يثبت A عند 40%.', 'في الخيار الصحيح يزيد B على C بعشر نقاط والمجموع يساوي 100.', `التوزيع المتزن هو ${answer}.`],
    );
  }

  if (mechanic === 'text-riddle') {
    const riddles = [
      { answer: 'MEMORY', clue: 'أحملك حين يختفي المكان، وقد أنكسر إلى شظايا من دون أن أموت.', options: ['MEMORY', 'SIGNAL', 'SHADOW', 'GATE'] },
      { answer: 'ECHO', clue: 'أعود إليك بصوتك، لكنني لا أبدأ الكلام أبدًا.', options: ['ECHO', 'GATE', 'LIGHT', 'TRACE'] },
      { answer: 'KEY', clue: 'لا أفتح بابًا من حديد؛ أفتح نصًا أغلقته الشيفرة.', options: ['KEY', 'WIRE', 'CLOCK', 'MASK'] },
      { answer: 'SHADOW', clue: 'أتبعك بلا خطوات، وأختفي عندما يغيب الضوء.', options: ['SHADOW', 'MEMORY', 'CODE', 'NORTH'] },
    ] as const;
    const riddle = pick(riddles, seed, 'riddle');
    return make(
      'همس داخل الذاكرة',
      'اقرأ الوصف وحدد المفهوم الوحيد الذي تنطبق عليه كل الجمل.',
      `«${riddle.clue}»`,
      riddle.answer,
      riddle.options,
      'evidence',
      [{ label: 'CLUE 01', detail: riddle.clue }, { label: 'RULE', detail: 'كل جملة يجب أن تنطبق' }],
      ['لا تختَر كلمة تناسب نصف الوصف فقط.', `فكّر في معنى: ${riddle.clue.split('،')[0]}.`, `الإجابة هي ${riddle.answer}.`],
    );
  }

  if (mechanic === 'symbol-pair') {
    const families = [
      { filled: '◆', empty: '◇', second: '●', answer: '○', options: ['○', '●', '◆', '□'] },
      { filled: '■', empty: '□', second: '▲', answer: '△', options: ['△', '▲', '■', '○'] },
      { filled: '⬢', empty: '⬡', second: '✦', answer: '✧', options: ['✧', '✦', '⬢', '◇'] },
    ] as const;
    const family = pick(families, seed, 'symbol-family');
    return make(
      'مرآة الرموز',
      'استخرج التحول من الزوج الأول وطبّقه على الرمز الثالث.',
      `${family.filled} → ${family.empty}   //   ${family.second} → ?`,
      family.answer,
      family.options,
      'pattern',
      [{ label: 'PAIR A', detail: `${family.filled} → ${family.empty}` }, { label: 'PAIR B', detail: `${family.second} → ?` }],
      ['شكل الرمز لا يتغير؛ الذي يتغير هو امتلاؤه.', 'حوّل الرمز الثالث من ممتلئ إلى مفرغ.', `الرمز الناتج هو ${family.answer}.`],
    );
  }

  if (mechanic === 'spatial-rotation') {
    const arrows = ['↑', '→', '↓', '←'] as const;
    const startIndex = hash(`${seed}:rotation-start`) % arrows.length;
    const sequence = Array.from({ length: 3 }, (_, index) => arrows[(startIndex + index) % arrows.length]!);
    const answer = arrows[(startIndex + 3) % arrows.length]!;
    return make(
      'دوران البوصلة',
      'كل نبضة تدير السهم ربع دورة مع عقارب الساعة. اختر الاتجاه التالي.',
      `${sequence.join('  →  ')}  →  ?`,
      answer,
      arrows,
      'matrix',
      sequence.map((arrow, index) => ({ label: `TURN ${index + 1}`, detail: arrow })),
      ['راقب اتجاه الدوران، لا حركة السهم على الشاشة.', 'ربع دورة مع عقارب الساعة يعني: أعلى، يمين، أسفل، يسار.', `الاتجاه التالي هو ${answer}.`],
    );
  }

  if (mechanic === 'word-path') {
    const paths = [
      ['WAKE', 'TRACE', 'REMEMBER'],
      ['LISTEN', 'ALIGN', 'RETURN'],
      ['FIND', 'CONNECT', 'RESTORE'],
      ['SCAN', 'VERIFY', 'OPEN'],
    ] as const;
    const path = pick(paths, seed, 'word-path');
    const answer = path.join('>');
    const alternatives = [
      [...path].reverse().join('>'),
      `${path[1]}>${path[0]}>${path[2]}`,
      `${path[0]}>${path[2]}>${path[1]}`,
    ];
    return make(
      'مسار الكلمات',
      'رتّب الكلمات حسب أرقام الأثر لتكوين أمر استعادة صالح.',
      'WORD TRACE // اتبع 01 ثم 02 ثم 03',
      answer,
      [answer, ...alternatives],
      'order',
      shuffle(path.map((word, index) => ({ label: word, detail: `TRACE ${String(index + 1).padStart(2, '0')}` })), `${seed}:word-items`),
      ['رقم TRACE هو موضع الكلمة في الأمر.', `ابدأ بـ ${path[0]} وانتهِ بـ ${path[2]}.`, `المسار الكامل هو ${answer}.`],
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
  const periodSlot = Math.floor(Date.parse(`${periodKey}T00:00:00.000Z`) / (24 * 60 * 60 * 1000));
  const rotationStart = kind === 'weekly'
    ? Math.floor(periodSlot / 7) % SMART_MECHANIC_ROTATION.length
    : periodSlot % SMART_MECHANIC_ROTATION.length;
  const mechanic = SMART_MECHANIC_ROTATION[
    (rotationStart + stageIndex) % SMART_MECHANIC_ROTATION.length
  ]!;
  const template = mechanic === 'memory-fragment'
    ? createMemoryTemplate(seed, kind)
    : mechanic === 'wiring'
      ? createWiringTemplate(seed, kind)
      : mechanic === 'cipher'
        ? createCipherTemplate(seed, kind)
        : createChoiceTemplate(seed, kind, mechanic);
  // The frame is part of the authored clue packet, not cosmetic noise. It
  // makes every period materially distinct even when two mechanics share a
  // safe arithmetic shape.
  return {
    ...template,
    prompt: `${template.prompt} // MEMORY FRAME ${hash(seed).toString(36).toUpperCase()}`,
  };
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
  if (
    !template.templateId
    || !template.answer
    || template.answer.length > 80
    || template.hints.length !== 3
    || template.prompt.includes('NaN')
    || template.options.some((option) => option.startsWith('DECOY-'))
  ) return false;
  if (template.mechanic === 'memory-fragment') {
    const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'memory-fragment' }>;
    const orderedIds = template.answer.split(',');
    return visual.pieces.length === visual.rows * visual.columns
      && new Set(visual.pieces.map((piece) => piece.id)).size === visual.pieces.length
      && orderedIds.length === visual.pieces.length
      && orderedIds.every((id) => visual.pieces.some((piece) => piece.id === id))
      && visual.pieces.every((piece) => /^\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.test(piece.backgroundPosition));
  }
  if (template.mechanic === 'wiring') {
    const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'wiring' }>;
    const targetById = new Map(visual.targets.map((target) => [target.id, target]));
    const sourceById = new Map(visual.sources.map((source) => [source.id, source]));
    const pairs = template.answer.split('|').map((pair) => pair.split('='));
    return visual.sources.length === visual.targets.length
      && visual.sources.length >= 3
      && new Set(visual.sources.map((source) => source.id)).size === visual.sources.length
      && new Set(visual.targets.map((target) => target.id)).size === visual.targets.length
      && pairs.length === visual.sources.length
      && new Set(pairs.map(([, targetId]) => targetId)).size === visual.targets.length
      && pairs.every(([sourceId, targetId]) => (
        Boolean(sourceId && targetId)
        && sourceById.get(sourceId!)?.signature === targetById.get(targetId!)?.signature
      ));
  }
  if (template.mechanic === 'cipher') {
    const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'cipher' }>;
    return visual.encoded.length === template.answer.length
      && template.options.length === 4
      && new Set(template.options).size === 4
      && template.options.includes(template.answer);
  }
  const visual = template.visual as Extract<LiveChallengeVisual, { kind: 'choice' }>;
  return visual.items.length >= 2
    && template.options.length === 4
    && new Set(template.options).size === 4
    && template.options.includes(template.answer);
}

const qualitySamples = Array.from({ length: 75 }, (_, index) => (
  smartLiveTemplateFor(`2026-${String((index % 12) + 1).padStart(2, '0')}-01`, 'weekly', index % SMART_WEEKLY_STAGE_COUNT)
));
const invalidQualitySample = qualitySamples.find((template) => !isSmartLiveTemplateValid(template));
if (invalidQualitySample) {
  throw new Error(`Smart live puzzle generator contains an invalid template: ${invalidQualitySample.mechanic}/${invalidQualitySample.answer}/${invalidQualitySample.options.length}`);
}

export type SmartLivePublicDefinition = LiveChallengePublicDefinition & {
  mechanic: SmartMechanic;
};
