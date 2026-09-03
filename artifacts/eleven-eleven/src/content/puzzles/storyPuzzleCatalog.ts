import {
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
} from '../manhwa/finalManhwa';
import type {
  StoryPuzzleDefinition,
  StoryPuzzleEchoImpact,
  StoryPuzzleOption,
  StoryPuzzleText,
} from '../../domain/story-puzzles/storyPuzzleContracts';

const text = (ar: string, en: string): StoryPuzzleText => ({ ar, en });

const option = (
  id: string,
  ar: string,
  en: string,
  symbol: string,
): StoryPuzzleOption => ({ id, label: text(ar, en), symbol });

const systemOptions = Object.freeze([
  option('signal', 'الإشارة', 'Signal', '⌁'),
  option('access', 'الوصول', 'Access', '⌘'),
  option('memory', 'الذاكرة', 'Memory', '◇'),
  option('echo', 'Echo', 'Echo', '◉'),
] as const);

const page = (globalPageNumber: number) => {
  const source = FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[globalPageNumber];
  if (!source) throw new Error(`Missing corrected Manhwa page ${globalPageNumber}.`);
  return { pageId: source.id, globalPageNumber: source.globalPageNumber };
};

/**
 * Only the approved opening slice is playable. Later PDF chapters remain in
 * the immutable publication package but have no puzzle/reward bindings until
 * their page/reveal matrix passes Canon review.
 */
export const STORY_PUZZLES: readonly StoryPuzzleDefinition[] = Object.freeze([
  {
    id: 'story_puzzle_01_echo_network_signal_sync',
    order: 1,
    chapterId: 'chapter_1',
    classification: 'main',
    title: text('مزامنة إشارة 11:11', '11:11 Signal Sync'),
    objective: text(
      'ثبّت النبضة التي تبقى متسقة عندما تعود الساعة إلى 11:11.',
      'Stabilize the pulse that remains coherent when the clock returns to 11:11.',
    ),
    mechanic: 'signal',
    difficulty: 'intro',
    source: page(7),
    prerequisitePuzzleIds: [],
    hints: [
      text('الوقت ليس الجواب وحده؛ ابحث عن القناة التي لا تنكسر معه.', 'The time is not the answer by itself; look for the channel that remains intact with it.'),
      text('قارن النبضة الهادئة بالنبضات التي تترك أثراً متشظياً.', 'Compare the steady pulse with the pulses that leave fragmented traces.'),
      text('القناة 11 هي الوحيدة التي تحتفظ بتردد 58 من دون انقطاع.', 'Channel 11 is the only one that retains frequency 58 without a break.'),
    ],
    completionMessage: text('تم تثبيت الإشارة. فتح الأرشيف طبقة إضافية.', 'Signal stabilized. The archive opens another layer.'),
    brief: text(
      'الضجيج لا يريدك أن تسمع Echo. افصل نبضة واحدة حقيقية قبل أن يغلق السجل.',
      'The noise does not want you to hear Echo. Isolate one true pulse before the record closes.',
    ),
    reference: {
      title: text('سجل النبضات', 'Pulse log'),
      entries: [
        text('القنوات 07 و13 تتشظى عند 11:11؛ القناة 11 تبقى متصلة.', 'Channels 07 and 13 fracture at 11:11; channel 11 remains connected.'),
        text('التردد 58 هو النبضة الوحيدة التي لا تتجاوز حد الضجيج.', 'Frequency 58 is the only pulse that does not cross the noise threshold.'),
      ],
    },
    signal: {
      frequencyOptions: [42, 58, 73],
      channelOptions: ['07', '11', '13'],
      visualProfile: 'opening',
    },
    options: systemOptions,
  },
  {
    id: 'story_puzzle_02_echo_network_archive_route',
    order: 2,
    chapterId: 'chapter_1',
    classification: 'main',
    title: text('مسار أرشيف Echo', 'Echo Archive Route'),
    objective: text(
      'رتّب المسار الذي يصل الإشارة إلى Echo من دون خلط الذاكرة بصلاحية الوصول.',
      'Order the route that reaches Echo without confusing memory with access clearance.',
    ),
    mechanic: 'sequence',
    difficulty: 'intro',
    source: page(9),
    prerequisitePuzzleIds: ['story_puzzle_01_echo_network_signal_sync'],
    hints: [
      text('ابدأ بما يدخل إلى النظام، لا بما يرد منه.', 'Begin with what enters the system, not what comes back from it.'),
      text('لا يمكن لـ Echo استقبال الإشارة قبل أن تمنحها البوابة تصريح الوصول.', 'Echo cannot receive the signal before the gate grants it access.'),
      text('المسار الوحيد المتصل هو: الإشارة ← الوصول ← الذاكرة ← Echo.', 'The only continuous route is: signal → access → memory → Echo.'),
    ],
    completionMessage: text('تم التحقق من المسار. تبقى الحقيقة خلف طبقة محجوبة.', 'Route verified. The truth remains behind a sealed layer.'),
    brief: text(
      'النظام يعرض لك طريقاً، لكنه لا يقول إن كان طريق إنقاذ أو طريق احتجاز.',
      'The system shows a route, but not whether it is a rescue route or a containment route.',
    ),
    reference: {
      title: text('بصمة الوصول', 'Access imprint'),
      entries: [
        text('الإشارة تطلب تصريح الوصول قبل أن تُحفظ في الذاكرة.', 'A signal requests access clearance before it is retained in memory.'),
        text('Echo هو نقطة الاستقبال، وليس بوابة البداية.', 'Echo is the receiving endpoint, not the entry gate.'),
      ],
    },
    options: systemOptions,
  },
]);

export const STORY_PUZZLE_ECHO_IMPACTS: Readonly<Record<string, StoryPuzzleEchoImpact>> =
  Object.freeze({
    story_puzzle_01_echo_network_signal_sync: {
      axis: 'stability',
      amount: 1,
      label: text('استقرار النبضة', 'Pulse stability'),
    },
    story_puzzle_02_echo_network_archive_route: {
      axis: 'clarity',
      amount: 1,
      label: text('وضوح المسار', 'Route clarity'),
    },
  });

for (const puzzle of STORY_PUZZLES) {
  if (!STORY_PUZZLE_ECHO_IMPACTS[puzzle.id]) {
    throw new Error(`Missing Echo impact for Story Puzzle ${puzzle.id}.`);
  }
}

export const STORY_PUZZLE_BY_ID = Object.freeze(Object.fromEntries(
  STORY_PUZZLES.map((puzzle) => [puzzle.id, puzzle]),
) as Record<string, StoryPuzzleDefinition>);

export const STORY_PUZZLE_MEMORY_SHARD_IDS = Object.freeze(
  STORY_PUZZLES.map((puzzle) => (
    `story_puzzle_shard_${String(puzzle.order).padStart(2, '0')}`
  )),
);

export const STORY_PUZZLE_COUNTS = Object.freeze({
  total: STORY_PUZZLES.length,
  main: STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'main').length,
  secret: STORY_PUZZLES.filter((puzzle) => puzzle.classification === 'secret').length,
});
