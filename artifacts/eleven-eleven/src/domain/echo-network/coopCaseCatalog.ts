import { FINAL_MANHWA_ASSET_ROOT } from '../../content/manhwa/finalManhwa';
import type { LocalizedCopy } from './contracts';

export type CoopMechanic =
  | 'image-reconstruction'
  | 'wiring'
  | 'cipher'
  | 'evidence'
  | 'timeline'
  | 'routing'
  | 'load-balance'
  | 'pattern';

export interface CoopStagePublicDefinition {
  id: string;
  mechanic: CoopMechanic;
  objective: LocalizedCopy;
  prompt: LocalizedCopy;
  optionIds: readonly string[];
  optionLabels: Readonly<Record<string, LocalizedCopy>>;
}

export interface CoopCasePublicDefinition {
  id: string;
  chapterId: 'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4';
  order: number;
  title: LocalizedCopy;
  description: LocalizedCopy;
  imageSrc: string;
  focusCharacter: 'yuki' | 'nara' | 'kenja' | 'lina' | 'zero' | 'echo';
  difficulty: 'guided' | 'standard' | 'deep';
  estimatedMinutes: number;
  stages: readonly CoopStagePublicDefinition[];
}

const copy = (ar: string, en: string): LocalizedCopy => ({ ar, en });
const labels = (...pairs: readonly (readonly [string, string, string])[]) => Object.freeze(
  Object.fromEntries(pairs.map(([id, ar, en]) => [id, copy(ar, en)])),
);

function stage(
  id: string,
  mechanic: CoopMechanic,
  objective: LocalizedCopy,
  prompt: LocalizedCopy,
  options: readonly (readonly [string, string, string])[],
): CoopStagePublicDefinition {
  return Object.freeze({
    id,
    mechanic,
    objective,
    prompt,
    optionIds: Object.freeze(options.map(([optionId]) => optionId)),
    optionLabels: labels(...options),
  });
}

const SIGNAL_OPTIONS = [
  ['echo', 'Echo', 'Echo'],
  ['memory', 'ذاكرة', 'Memory'],
  ['access', 'وصول', 'Access'],
  ['signal', 'إشارة', 'Signal'],
] as const;

const PATH_OPTIONS = [
  ['north', 'الشمال', 'North'],
  ['east', 'الشرق', 'East'],
  ['south', 'الجنوب', 'South'],
  ['west', 'الغرب', 'West'],
] as const;

function makeCase(
  seed: {
    id: string;
    chapterId: CoopCasePublicDefinition['chapterId'];
    order: number;
    title: LocalizedCopy;
    description: LocalizedCopy;
    image: number;
    focusCharacter: CoopCasePublicDefinition['focusCharacter'];
    difficulty: CoopCasePublicDefinition['difficulty'];
    mechanics: readonly [CoopMechanic, CoopMechanic, CoopMechanic];
  },
): CoopCasePublicDefinition {
  const patternOptions = [
    ['11-11', '11 · 11', '11 · 11'],
    ['11-01', '11 · 01', '11 · 01'],
    ['01-11', '01 · 11', '01 · 11'],
    ['00-11', '00 · 11', '00 · 11'],
  ] as const;
  return Object.freeze({
    id: seed.id,
    chapterId: seed.chapterId,
    order: seed.order,
    title: seed.title,
    description: seed.description,
    imageSrc: `${FINAL_MANHWA_ASSET_ROOT}/page-${String(seed.image).padStart(3, '0')}.webp`,
    focusCharacter: seed.focusCharacter,
    difficulty: seed.difficulty,
    estimatedMinutes: seed.difficulty === 'guided' ? 12 : seed.difficulty === 'standard' ? 15 : 18,
    stages: Object.freeze([
      stage(
        `${seed.id}-route`, seed.mechanics[0],
        copy('وحّدوا مسار الذاكرة.', 'Unify the memory route.'),
        copy('كل دور يملك جزءًا مختلفًا من اتجاه الخروج.', 'Each role owns a different part of the exit direction.'),
        PATH_OPTIONS,
      ),
      stage(
        `${seed.id}-identity`, seed.mechanics[1],
        copy('ثبّتوا هوية الإشارة.', 'Lock the signal identity.'),
        copy('ادمجوا المفتاح مع سجل المرساة قبل الاختيار.', 'Combine the key with the anchor record before choosing.'),
        SIGNAL_OPTIONS,
      ),
      stage(
        `${seed.id}-pattern`, seed.mechanics[2],
        copy('أغلقوا النمط الأخير.', 'Close the final pattern.'),
        copy('لا يرى أي لاعب النمط الكامل وحده.', 'No player sees the complete pattern alone.'),
        patternOptions,
      ),
    ]),
  });
}

/**
 * The opaque IDs remain unchanged because the Realtime service validates active
 * rooms against them. They are not player-facing Canon. Until the page/scene
 * matrix is approved, every live case stays in the released opening chapter,
 * uses only pages 7 or 9, and describes a neutral team signal exercise.
 */
const CASE_SEEDS = [
  ['warm-signal', 'chapter_1', 1, 'نبض البوابة', 'Gate Pulse', 7, 'echo', 'guided', ['wiring', 'cipher', 'pattern']],
  ['broken-window', 'chapter_1', 2, 'نافذة الأثر', 'Trace Window', 9, 'echo', 'guided', ['image-reconstruction', 'evidence', 'routing']],
  ['first-contract', 'chapter_1', 3, 'الرابط الأول', 'First Link', 7, 'echo', 'standard', ['timeline', 'cipher', 'load-balance']],
  ['nara-farewell', 'chapter_1', 4, 'تردد صامت', 'Quiet Frequency', 9, 'echo', 'standard', ['evidence', 'timeline', 'pattern']],
  ['red-circuit', 'chapter_1', 5, 'دائرة الإشارة', 'Signal Circuit', 7, 'echo', 'standard', ['wiring', 'routing', 'load-balance']],
  ['silent-key', 'chapter_1', 6, 'مفتاح الأرشيف', 'Archive Key', 9, 'echo', 'standard', ['cipher', 'evidence', 'pattern']],
  ['kenja-record', 'chapter_1', 7, 'سجل العقدة', 'Node Record', 7, 'echo', 'standard', ['timeline', 'image-reconstruction', 'routing']],
  ['zero-route', 'chapter_1', 8, 'مسار الإشارة', 'Signal Route', 9, 'echo', 'deep', ['routing', 'cipher', 'load-balance']],
  ['mirror-memory', 'chapter_1', 9, 'مرآة الأثر', 'Trace Mirror', 7, 'echo', 'deep', ['image-reconstruction', 'pattern', 'evidence']],
  ['lina-protocol', 'chapter_1', 10, 'بروتوكول الوصول', 'Access Protocol', 9, 'echo', 'deep', ['load-balance', 'wiring', 'cipher']],
  ['black-coronation', 'chapter_1', 11, 'نقطة الانعكاس', 'Reflection Point', 7, 'echo', 'deep', ['evidence', 'timeline', 'pattern']],
  ['echo-fracture', 'chapter_1', 12, 'خريطة الشظايا', 'Shard Map', 9, 'echo', 'deep', ['routing', 'load-balance', 'image-reconstruction']],
] as const;

export const COOP_CASES: readonly CoopCasePublicDefinition[] = Object.freeze(
  CASE_SEEDS.map((seed) => makeCase({
    id: `coop-${seed[0]}`,
    chapterId: seed[1],
    order: seed[2],
    title: copy(seed[3], seed[4]),
    description: copy(
      'قضية من ثلاث مراحل موزعة الأدلة بين أدوار الفريق.',
      'A three-stage case with evidence split across team roles.',
    ),
    image: seed[5],
    focusCharacter: seed[6],
    difficulty: seed[7],
    mechanics: seed[8],
  })),
);

export const COOP_CASE_BY_ID = Object.freeze(
  Object.fromEntries(COOP_CASES.map((definition) => [definition.id, definition])) as
    Record<string, CoopCasePublicDefinition>,
);

export const COOP_TRAINING_CASE_ID = COOP_CASES[0]!.id;
