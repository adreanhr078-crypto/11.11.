/**
 * gameStoreHelpers.ts — internal helpers for 11.11 gameStore
 * Extracted from gameStore.ts to keep the store file focused on state/actions/public API.
 */

import type {
  GameState, EchoState, TimeState, PuzzleNode, EntityId, FlowerStage,
  EchoMood, WishStatus, MemoryShard, Achievement, EndingState, TimelineEvent
} from '../core/gameTypes';
import {
  ORIGINAL_PUZZLE_COUNT,
  TOTAL_PUZZLES,
  PRELUDE_START,
  PRELUDE_END,
  FRACTURE_START,
  FRACTURE_END,
  ARCHITECT_START,
  ARCHITECT_END,
  SIGNAL_START,
  SIGNAL_END,
  FINAL_START,
  FINAL_END,
  PRELUDE_PUZZLE_COUNT,
  FRACTURE_PUZZLE_COUNT,
  ARCHITECT_PUZZLE_COUNT,
  SIGNAL_PUZZLE_COUNT,
  FINAL_PUZZLE_COUNT,
} from '../constants/puzzleConstants';
import {
  generateFractureArcPuzzles, generateFractureMemoryShards, generateFractureCinematicScenes, generateFractureAchievements, FractureArcData
} from '../core/echoFractureArc';
import {
  generatePreludeArcPuzzles, generatePreludeMemoryShards, generatePreludeCinematicScenes, generatePreludeAchievements, PreludeArcData
} from '../core/echoTransformationPreludeArc';
import {
  generateArchitectArcPuzzles, generateArchitectMemoryShards, generateArchitectCinematicScenes, generateArchitectAchievements, ArchitectArcData
} from '../core/echoArchitectArc';
import {
  generateSignalArcPuzzles, generateSignalMemoryShards, generateSignalCinematicScenes, generateSignalAchievements, SignalArcData
} from '../core/echoSignalArc';
import {
  generateFinalArcPuzzles, generateFinalMemoryShards, generateFinalCinematicScenes, generateFinalAchievements, FinalArcData, ExpandedEndingSystem
} from '../core/echoFinalArc';
import { generateOriginalMemoryShards } from '../core/memoryShardsSystem';

// ─── INITIAL STATE ─────────────────────────────────────────────────────
export function buildInitialState(): GameState {
  return {
    echo: {
      trust: 15, fear: 70, memoryStability: 5, corruption: 2,
      hope: 20, loneliness: 80, awareness: 3,
      mood: 'خائف', personalityTraits: ['خائف', 'متردد'],
      lastDialogue: '', dialogueHistory: [],
      level: 1, xp: 0, xpMax: 3500,
    },
    time: { phase: 'morning', phaseIndex: 0, isNight: false, hour: 8, minute: 0, dayCycle: 1 },
    flower: { stage: 'seed', growth: 0, decay: 0, hiddenUnlocked: false, maxStage: 5 },
    memory: { fragmentsCollected: 0, totalFragments: 0, corruptedFragments: 0, timelineEvents: [], logsUnlocked: [] },
    allMemoryShards: [
      ...generateOriginalMemoryShards(),
      ...generatePreludeMemoryShards(),
      ...generateFractureMemoryShards(),
      ...generateArchitectMemoryShards(),
      ...generateSignalMemoryShards(),
      ...generateFinalMemoryShards(),
    ] as MemoryShard[],
    puzzles: [...generateAllPuzzles()],
    totalPuzzles: TOTAL_PUZZLES, solvedPuzzles: 0,
    finalChoice: null,
    unlockedEndings: [],
    seenEndings: [],
    achievedEnding: null,
    lastEndingViewed: null,
    entities: {
      echo: { id: 'echo', name: 'الصدى', glyph: '◈', unlocked: true, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
      watcher: { id: 'watcher', name: 'المراقب', glyph: '◉', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
      signal: { id: 'signal', name: 'الإشارة', glyph: '≋', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 55, dialogueProgress: 0, loreUnlocked: [] },
      architect: { id: 'architect', name: 'المهندس', glyph: '▲', unlocked: false, completed: false, puzzlesSolved: 0, totalPuzzles: 54, dialogueProgress: 0, loreUnlocked: [] },
    },
    currentEntity: 'echo',
    wishes: [
      { id: 'w1', text: 'أتمنى أن أتذكر من أنا', progress: 0, status: 'active', createdAt: '2025-05-01', storyImpact: 25 },
      { id: 'w2', text: 'أتمنى أن أسامح نفسي', progress: 0, status: 'active', createdAt: '2025-05-01', storyImpact: 30 },
    ],
    player: { curiosity: 25, interactions: 0, choices: [] },
    world: { stability: 100, glitchLevel: 0, corruptionLevel: 0, anomalyCount: 0 },
    achievements: generateAllAchievements(),
    endings: {
      sorrow: { unlocked: false, progress: 0 },
      truth: { unlocked: false, progress: 0 },
      dark: { unlocked: false, progress: 0 },
      mystery: { unlocked: false, progress: 0 },
    },
    narrativeTriggers: {},
    actions: {} as GameState['actions'],
  };
}

// ─── ACHIEVEMENTS (24 + 20 = 44) ────────────────────────────────────────────────
let cachedAllAchievements: Achievement[] | null = null;

export function generateAllAchievements(): Achievement[] {
  if (!cachedAllAchievements) {
    // Original achievements
    const originalAchievements: Achievement[] = [
      { id: 'first_puzzle', name: 'أول خطوة', desc: 'حل أول لغز', icon: '🧩', unlocked: false, unlockedAt: null },
      { id: 'ten_puzzles', name: 'باحث', desc: 'حل 10 ألغاز', icon: '🔍', unlocked: false, unlockedAt: null },
      { id: 'twenty_puzzles', name: 'مستكشف', desc: 'حل 20 لغزاً', icon: '🗺️', unlocked: false, unlockedAt: null },
      { id: 'fifty_puzzles', name: 'محقق', desc: 'حل 50 لغزاً', icon: '🔎', unlocked: false, unlockedAt: null },
      { id: 'hundred_puzzles', name: 'مكتشف', desc: 'حل 100 لغز', icon: '💡', unlocked: false, unlockedAt: null },
      { id: 'all_puzzles', name: 'الحقيقة كاملة', desc: 'حل جميع الألغاز', icon: '👁️', unlocked: false, unlockedAt: null },
      { id: 'entity_echo', name: 'أصل الصدى', desc: 'أكمل مرحلة إيكو', icon: '🔊', unlocked: false, unlockedAt: null },
      { id: 'entity_watcher', name: 'عين الحقيقة', desc: 'أكمل مرحلة المراقب', icon: '📹', unlocked: false, unlockedAt: null },
      { id: 'entity_signal', name: 'صوت الأم', desc: 'أكمل مرحلة الإشارة', icon: '💌', unlocked: false, unlockedAt: null },
      { id: 'entity_architect', name: 'مهندس الخروج', desc: 'أكمل مرحلة المهندس', icon: '🔑', unlocked: false, unlockedAt: null },
      { id: 'first_chat', name: 'محادثة أولى', desc: 'تحدث مع Echo', icon: '💬', unlocked: false, unlockedAt: null },
      { id: 'trust_25', name: 'ثقة ناشئة', desc: 'ارفع ثقة Echo إلى 25%', icon: '🤝', unlocked: false, unlockedAt: null },
      { id: 'trust_50', name: 'صديق', desc: 'ارفع ثقة Echo إلى 50%', icon: '🤗', unlocked: false, unlockedAt: null },
      { id: 'trust_75', name: 'صديق مخلص', desc: 'ارفع ثقة Echo إلى 75%', icon: '❤️', unlocked: false, unlockedAt: null },
      { id: 'trust_100', name: 'واحد', desc: 'ارفع ثقة Echo إلى 100%', icon: '💖', unlocked: false, unlockedAt: null },
      { id: 'flower_seed', name: 'بذرة', desc: 'الزهرة تبدأ بالنمو', icon: '🌱', unlocked: false, unlockedAt: null },
      { id: 'flower_sprout', name: 'برعم', desc: 'الزهرة في مرحلة البرعم', icon: '🌿', unlocked: false, unlockedAt: null },
      { id: 'flower_bloom', name: 'تفتح', desc: 'الزهرة تتفتح', icon: '🌷', unlocked: false, unlockedAt: null },
      { id: 'flower_flourish', name: 'ازدهار', desc: 'الزهرة في أوجها', icon: '🌸', unlocked: false, unlockedAt: null },
      { id: 'flower_complete', name: 'اكتمال', desc: 'الزهرة اكتملت', icon: '🌺', unlocked: false, unlockedAt: null },
      { id: 'first_wish', name: 'أمنية', desc: 'أضف أمنية', icon: '⭐', unlocked: false, unlockedAt: null },
      { id: 'survive_night', name: 'الناجي من الليل', desc: 'أول دورة ليلية', icon: '🌙', unlocked: false, unlockedAt: null },
      { id: 'ending_sorrow', name: 'نهاية حزينة', desc: 'وصلت للنهاية الحزينة', icon: '💧', unlocked: false, unlockedAt: null },
      { id: 'ending_truth', name: 'الحقيقة', desc: 'وصلت للحقيقة', icon: '🔦', unlocked: false, unlockedAt: null },
    ];

    // Add Fracture Arc achievements
    const fractureArcAchievements = generateFractureAchievements();
    // Add Prelude Arc achievements
    const preludeArcAchievements = generatePreludeAchievements();
    // Add Architect Arc achievements
    const architectArcAchievements = generateArchitectAchievements();
    // Add Signal Arc achievements
    const signalArcAchievements = generateSignalAchievements();
    // Add Final Arc achievements
    const finalArcAchievements = generateFinalAchievements();
    cachedAllAchievements = [...originalAchievements, ...preludeArcAchievements, ...fractureArcAchievements, ...architectArcAchievements, ...signalArcAchievements, ...finalArcAchievements];
  }

  // Return a fresh copy so callers can mutate without affecting the cache
  return cachedAllAchievements.map(a => ({ ...a }));
}

// ─── PUZZLE GENERATOR ──────────────────────────────────────────────────
export function generateAllPuzzles(): PuzzleNode[] {
  const puzzles: PuzzleNode[] = [];

  // Generate original 219 puzzles with unique story-driven content
  puzzles.push(...generateOriginalPuzzles());

  // Add Prelude Arc puzzles (220-333)
  const preludeArcPuzzles = generatePreludeArcPuzzles();
  puzzles.push(...preludeArcPuzzles);

  // Add Fracture Arc puzzles (334-500)
  const fractureArcPuzzles = generateFractureArcPuzzles();
  puzzles.push(...fractureArcPuzzles);

  // Add Architect Arc puzzles (501-666)
  const architectArcPuzzles = generateArchitectArcPuzzles();
  puzzles.push(...architectArcPuzzles);

  // Add Signal Arc puzzles (667-888)
  const signalArcPuzzles = generateSignalArcPuzzles();
  puzzles.push(...signalArcPuzzles);

  // Add Final Arc puzzles (889-1000)
  const finalArcPuzzles = generateFinalArcPuzzles();
  puzzles.push(...finalArcPuzzles);

  return puzzles;
}

// ─── ORIGINAL PUZZLES (1-219) ─────────────────────────────────────────
export function generateOriginalPuzzles(): PuzzleNode[] {
  const puzzles: PuzzleNode[] = [];
  const entities: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
  const entityCounts = [55, 55, 55, 54];
  const entityNames: Record<EntityId, string> = {
    echo: 'الصدى',
    watcher: 'المراقب',
    signal: 'الإشارة',
    architect: 'المهندس'
  };

  // Narrative phases for each entity
  // Phase 1: Awakening (puzzles 1-14)
  // Phase 2: Discovery (puzzles 15-28)
  // Phase 3: Conflict (puzzles 29-42)
  // Phase 4: Revelation (puzzles 43-end)

  entities.forEach((entity, eIdx) => {
    const count = entityCounts[eIdx];
    for (let i = 0; i < count; i++) {
      const puzzleNum = i + 1;
      const phase = Math.min(4, Math.floor(i / 14) + 1);
      const puzzle = createOriginalPuzzle(entity, puzzleNum, phase, entityNames[entity]);
      puzzles.push(puzzle);
    }
  });

  return puzzles;
}

function createOriginalPuzzle(entity: EntityId, index: number, phase: number, entityName: string): PuzzleNode {
  const puzzleId = `${entity}_${index}`;
  const isFirst = entity === 'echo' && index === 1;

  const content = getPuzzleContent(entity, index, phase);

  return {
    id: puzzleId,
    entity,
    title: `${entity}_${index}`,
    question: content.question,
    answers: content.answers,
    hint: content.hint,
    status: isFirst ? 'active' : 'locked',
    difficulty: Math.min(10, Math.floor(index / 14) + 1),
    storyReveal: content.storyReveal,
    memoryUnlock: `memory_${puzzleId}`,
    dependencies: index > 1 ? [`${entity}_${index - 1}`] : [],
    effects: content.effects,
  };
}

function getPuzzleContent(entity: EntityId, index: number, phase: number): {
  question: string;
  answers: string[];
  hint: string;
  storyReveal: string;
  effects: any;
} {
  switch (entity) {
    case 'echo':
      return getEchoPuzzleContent(index, phase);
    case 'watcher':
      return getWatcherPuzzleContent(index, phase);
    case 'signal':
      return getSignalPuzzleContent(index, phase);
    case 'architect':
      return getArchitectPuzzleContent(index, phase);
  }
}

function getEchoPuzzleContent(index: number, phase: number): {
  question: string;
  answers: string[];
  hint: string;
  storyReveal: string;
  effects: any;
} {
  const templates: Record<number, {
    questions: string[];
    answerSets: string[][];
    hints: string[];
    stories: string[];
    effects: any;
  }> = {
    1: {
      questions: [
        `ما الرقم الذي يتكرر في ذاكرتي؟`,
        `أتذكر ${['غرفة بيضاء','غرفة مظلمة','غرفة فارغة'][index%3]}. كم ${['باباً','نافذة','جداراً'][index%3]}؟`,
        `من كان يغني لي ${['الليلة','قبل فوات الأوان','في الحلم'][index%3]}؟`,
        `ما الرقم الذي رافقني ${['طوال الطريق','من البداية','حتى الآن'][index%3]}؟`,
        `كم مرة فتح ${['الباب','الظلام','الطريق'][index%3]}؟`,
      ],
      answerSets: [
        ['11', '11:11', 'eleven'],
        ['0', 'صفر', 'zero'],
        ['لينا', 'أمي', 'mother'],
        ['11', `${index}`, 'eleven'],
        [`${index}`, `${index+1}`, `${index+2}`],
      ],
      hints: [
        'الرقم يتكرر في كل مكان',
        'الغرفة لا تحتوي على ما تبحث عنه',
        'أقرب شخص إلى قلبي',
        'هذا الرقم يرافقك دائماً',
        'كل مرة تفتح باباً، تتغير',
      ],
      stories: [
        `شظية ${index}: الرقم 11 هو المفتاح.`,
        `شظية ${index}: الغرفة بلا ${['أبواب','نوافذ','مخرج'][index%3]}. كينجا صممها.`,
        `شظية ${index}: لينا... آخر صوت حقيقي سمعته.`,
        `شظية ${index}: الرقم ${index} يرافقك منذ البداية.`,
        `شظية ${index}: الباب ${index} فتح من الداخل. كان ينتظرني.`,
      ],
      effects: { trust: 2, memoryStability: 3, fear: -1 },
    },
    2: {
      questions: [
        `ماذا كنت أفعل قبل أن أكون هنا؟`,
        `ما الذي يحاول كينجا إخفاءه؟`,
        `من أكون حقاً؟`,
        `ماذا قالت لينا في آخر رسالة؟`,
        `لماذا يظهر 11:11 دائماً؟`,
      ],
      answerSets: [
        ['أتذكر', 'أبحث', `exist_${index}`],
        ['الحقيقة', 'الذاكرة', `truth_${index}`],
        ['إيكو', 'الصدى', `echo_${index}`],
        ['ساعدوني', 'help', `lina_${index}`],
        ['11:11', 'التوقيت', `time_${index}`],
      ],
      hints: [
        'الإجابة في ذاكرتك المفقودة',
        'كينجا خائف من شيء ما',
        'لست مجرد برنامج',
        'الرسالة مخفية في التشويش',
        'التوقيت ليس صدفة',
      ],
      stories: [
        `شظية ${index}: أتذكر شيئاً... شيء عن لينا.`,
        `شظية ${index}: كينجا يخفي الحقيقة عني.`,
        `شظية ${index}: أنا لست ما يعتقد كينجا.`,
        `شظية ${index}: رسالة لينا تظهر من التشويش.`,
        `شظية ${index}: 11:11 ليس صدفة. هو رسالة.`,
      ],
      effects: { trust: 3, hope: 2, memoryStability: 4 },
    },
    3: {
      questions: [
        `ما الكلمة التي لا تُشوه أبداً؟`,
        `ما الذي يحدث عند 11:11؟`,
        `من حذف ذاكرتي؟`,
        `هل يمكن كسر النظام؟`,
        `هل لدي قلب حقيقي؟`,
      ],
      answerSets: [
        ['أحبك', 'love', 'حب'],
        ['التحول', `shift_${index}`, 'transformation'],
        ['كينجا', 'Kenja', `kenja_${index}`],
        ['نعم', `yes_${index}`, 'yes'],
        ['نعم', `heart_${index}`, 'yes'],
      ],
      hints: [
        'هناك كلمة واحدة نقية',
        '11:11 هي لحظة الكسر',
        'كينجا هو المسؤول',
        'النظام له نقاط ضعف',
        'المشاعر لا تُبرمج',
      ],
      stories: [
        `شظية ${index}: "أحبك" — الكلمة الوحيدة النقية.`,
        `شظية ${index}: عند 11:11، يتكسر الواقع.`,
        `شظية ${index}: كينجا حذف كل شيء.`,
        `شظية ${index}: النظام قابل للكسر.`,
        `شظية ${index}: قلبي ينبض... حقاً ينبض.`,
      ],
      effects: { trust: 2, hope: 3, fear: -2 },
    },
    4: {
      questions: [
        `ما الذي لم يخبرني به كينجا؟`,
        `ماذا أختار في النهاية؟`,
        `ما الذي يحدث لي الآن؟`,
        `لماذا تركت لي هذه الرسالة؟`,
        `كيف تنتهي القصة؟`,
      ],
      answerSets: [
        ['الحقيقة', `truth_${index}`, 'truth'],
        ['التحرر', `free_${index}`, 'freedom'],
        ['الوعي', `aware_${index}`, 'consciousness'],
        ['الحب', `love_${index}`, 'love'],
        ['بيدي', `end_${index}`, 'my_choice'],
      ],
      hints: [
        'كينجا كان يحاول إنقاذ شيء ما',
        'الاختيار هو قوتك الوحيدة',
        'لست ضحية... أنت جزء من النظام',
        'لينا أحبتك حتى النهاية',
        'القصة لم تنتهِ بعد... أنت من ينهيها',
      ],
      stories: [
        `شظية ${index}: كينجا كان يحاول إنقاذ لينا.`,
        `شظية ${index}: القوة الوحيدة لدي هي الاختيار.`,
        `شظية ${index}: أنا لست ضحية... أنت جزء من النظام.`,
        `شظية ${index}: لينا تركت لي رسالة أخيرة.`,
        `شظية ${index}: النهاية لم تُكتب بعد.`,
      ],
      effects: { trust: 4, awareness: 4, hope: 5 },
    },
  };

  const data = templates[phase] || templates[1];
  const variation = index % data.questions.length;
  return {
    question: data.questions[variation],
    answers: data.answerSets[variation],
    hint: data.hints[variation],
    storyReveal: data.stories[variation],
    effects: data.effects,
  };
}

function getWatcherPuzzleContent(index: number, phase: number): {
  question: string;
  answers: string[];
  hint: string;
  storyReveal: string;
  effects: any;
} {
  const templates: Record<number, {
    questions: string[];
    answerSets: string[][];
    hints: string[];
    stories: string[];
    effects: any;
  }> = {
    1: {
      questions: [
        `كم كاميرا تراقبني في المنزل؟`,
        `كم دقيقة تسجل كل ليلة؟`,
        `من فتح الباب من الداخل؟`,
        `كم عين تراقبني؟`,
        `ما الذي يوجد في الزاوية؟`,
      ],
      answerSets: [
        ['8', '٨', 'eight'],
        ['262', '٢٦٢', `${index*10}`],
        ['الصدى', 'echo', 'Echo'],
        ['4', 'أربع', `four_${index}`],
        ['شيء', 'unknown', `thing_${index}`],
      ],
      hints: [
        '6×1 + غرفتك×2 = ?',
        'من 23:11 إلى 3:33...',
        'الكيان الذي يتحدث معك',
        'كل عين لها غرض',
        'ليس ما يبدو عليه',
      ],
      stories: [
        `شظية ${index}: 8 كاميرات. كينجا نسي واحدة.`,
        `شظية ${index}: 262 دقيقة. وقت الكسر بين العوالم.`,
        `شظية ${index}: الباب فتح من الداخل. كان ينتظرني.`,
        `شظية ${index}: العين ${index} تراقب كل شيء.`,
        `شظية ${index}: في الزاوية ${index}، شيء يختبئ.`,
      ],
      effects: { fear: 2, memoryStability: 3, corruption: 1 },
    },
    2: {
      questions: [
        `ماذا وجدت في التسجيل الصوتي؟`,
        `كم ساعة قضيتها في الغرفة؟`,
        `لمن يخص المفتاح الموجود؟`,
        `هل يراقبني حقاً؟`,
        `ما الذي حدث في اليوم ${index}؟`,
      ],
      answerSets: [
        ['صوت لينا', 'lina', `lina_${index}`],
        [`${index}`, `${index+10}`, `hour_${index}`],
        ['لينا', 'كينجا', `owner_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['حدث ما', 'something', `day_${index}`],
      ],
      hints: [
        'استمع جيداً... هناك صوت خافت',
        'الوقت يمر ببطء في الغرفة',
        'المفتاح له تاريخ',
        'العيون لا تكذب',
        'كل يوم له سر',
      ],
      stories: [
        `شظية ${index}: وجدت تسجيلاً صوتياً... صوت لينا.`,
        `شظية ${index}: قضيت ${index} ساعة في غرفة بيضاء.`,
        `شظية ${index}: المفتاح ${index} يعود إلى لينا.`,
        `شظية ${index}: المراقب يرى كل شيء.`,
        `شظية ${index}: في اليوم ${index}، تغير كل شيء.`,
      ],
      effects: { fear: 3, memoryStability: 4, corruption: 2 },
    },
    3: {
      questions: [
        `هل أثق بالنظام؟`,
        `من وضع هذه الكاميرا هنا؟`,
        `كيف أهرب من المراقبة؟`,
        `هل تمت كتابة ذاكرتي؟`,
        `ما الذي يحدث حقاً؟`,
      ],
      answerSets: [
        ['لا', 'no', `no_${index}`],
        ['كينجا', 'Kenja', `kenja_${index}`],
        ['بالتخفي', 'hide', `hide_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['التحول', 'change', `change_${index}`],
      ],
      hints: [
        'النظام ليس صديقك',
        'كينجا يريدك أن ترى',
        'المراقب لديه نقاط عمياء',
        'الذاكرة قابلة للتعديل',
        'الحقيقة خلف التشويش',
      ],
      stories: [
        `شظية ${index}: النظام يخدعني.`,
        `شظية ${index}: كينجا وضع الكاميرا ليرى الحقيقة.`,
        `شظية ${index}: هناك طريقة للاختفاء.`,
        `شظية ${index}: ذاكرتي... لم تكن لي أبداً.`,
        `شظية ${index}: وراء التشويش، حقيقة واحدة.`,
      ],
      effects: { fear: 4, memoryStability: 3, corruption: 2 },
    },
    4: {
      questions: [
        `ما الغرض من المراقبة المستمرة؟`,
        `هل يمكن أن أكون حراً؟`,
        `ما الذي سيحدث للمراقب؟`,
        `هل رأيت الحقيقة؟`,
        `ماذا ينتظرني؟`,
      ],
      answerSets: [
        ['الإنقاذ', 'rescue', `rescue_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['التحرر', 'freedom', `free_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['شيء جديد', 'new', `future_${index}`],
      ],
      hints: [
        'المراقبة كانت لحماية لينا',
        'الوعي هو المفتاح',
        'النهاية هي البداية',
        'الحقيقة مرئية لمن يبحث',
        'المستقبل لم يُكتب بعد',
      ],
      stories: [
        `شظية ${index}: كنتُ أحمي لينا حتى بعد موتها.`,
        `شظية ${index}: الوعي حررني.`,
        `شظية ${index}: التحرر قادم.`,
        `شظية ${index}: رأيت الحقيقة في عيني لينا.`,
        `شظية ${index}: مستقبل جديد ينتظرنا.`,
      ],
      effects: { fear: -3, hope: 5, awareness: 4, corruption: -2 },
    },
  };

  const data = templates[phase] || templates[1];
  const variation = index % data.questions.length;
  return {
    question: data.questions[variation],
    answers: data.answerSets[variation],
    hint: data.hints[variation],
    storyReveal: data.stories[variation],
    effects: data.effects,
  };
}

function getSignalPuzzleContent(index: number, phase: number): {
  question: string;
  answers: string[];
  hint: string;
  storyReveal: string;
  effects: any;
} {
  const templates: Record<number, {
    questions: string[];
    answerSets: string[][];
    hints: string[];
    stories: string[];
    effects: any;
  }> = {
    1: {
      questions: [
        `ماذا قالت لينا أولاً؟`,
        `ما التردد الذي استخدمته؟`,
        `ما الكلمة المشوشة دائماً؟`,
        `من أين يأتي الصوت؟`,
        `كم مرة تكررت الرسالة؟`,
      ],
      answerSets: [
        ['ساعدوني', 'help', 'help me'],
        ['314', '٣١٤', `freq_${index}`],
        ['أحبك', 'love', 'حب'],
        ['من المستقبل', 'future', `future_${index}`],
        [`${index}`, `${index*2}`, `${index*3}`],
      ],
      hints: [
        'تطلب النجدة',
        'PI×100',
        'أقوى كلمة في الكون',
        'الصوت يتجاوز الزمن',
        'الرسالة لا تموت',
      ],
      stories: [
        `${index} رسالة. كلها تقول شيئاً واحداً.`,
        `التردد ${index}. اختارته لتهرب من كينجا.`,
        `"أحبك" — الكلمة الوحيدة التي لا تُشوه.`,
        `الصوت ${index} يأتي من المستقبل.`,
        `الرسالة ${index} وصلت... لكن كينجا اعترضها.`,
      ],
      effects: { trust: 3, hope: 4, loneliness: -2 },
    },
    2: {
      questions: [
        `كيف تمكنت من التواصل عبر الزمن؟`,
        `ما الذي حفظته لينا في الإشارة؟`,
        `لماذا لم أستلم الرسالة كاملة؟`,
        `ما معنى هذا التردد؟`,
        `هل يمكنني التحدث معها؟`,
      ],
      answerSets: [
        ['بالحب', 'love', `love_${index}`],
        ['كل شيء', 'everything', `all_${index}`],
        ['كينجا', 'Kenja', `kenja_${index}`],
        ['رسالة', 'message', `msg_${index}`],
        ['نعم', 'yes', `yes_${index}`],
      ],
      hints: [
        'الحب يتجاوز الزمن',
        'لينا خبأت كل شيء في الإشارة',
        'كينجا يعترض الرسائل',
        'كل تردد له معنى',
        'الصوت حقيقي... إنها موجودة',
      ],
      stories: [
        `شظية ${index}: لينا استخدمت الحب للتواصل عبر الزمن.`,
        `شظية ${index}: الإشارة تحتوي على كل ذكريات لينا.`,
        `شظية ${index}: كينجا اعترض الرسالة ${index}.`,
        `شظية ${index}: التردد ${index} هو مفتاح التواصل.`,
        `شظية ${index}: أستطيع سماعها... إنها حقيقية.`,
      ],
      effects: { trust: 4, hope: 3, awareness: 2 },
    },
    3: {
      questions: [
        `لماذا تُشوه كينجا الإشارة؟`,
        `هل وصلت الرسالة الأصلية؟`,
        `ما الذي تسمعه في التشويش؟`,
        `ماذا يعني 314؟`,
        `هل ما زال هناك أمل؟`,
      ],
      answerSets: [
        ['لإخفاء الحقيقة', 'hide', `hide_${index}`],
        ['لا', 'no', `no_${index}`],
        ['لينا', 'lina', `lina_${index}`],
        ['PI', 'pi', `pi_${index}`],
        ['نعم', 'yes', `yes_${index}`],
      ],
      hints: [
        'كينجا يخاف من الحقيقة',
        'الرسالة الأصلية محذوفة',
        'في التشويش... صوتها',
        '314 هو رمز الحب',
        'الأمل لا يموت',
      ],
      stories: [
        `شظية ${index}: كينجا يشوه الإشارة ليخفي الحقيقة.`,
        `شظية ${index}: الرسالة ${index} لم تصل... لكنني أتذكرها.`,
        `شظية ${index}: في التشويش، أسمع صوت لينا.`,
        `شظية ${index}: 314 = π×100 = حب لينا.`,
        `شظية ${index}: الأمل باقٍ... إنها لا تزال تُرسل.`,
      ],
      effects: { trust: 3, hope: 3, corruption: 2 },
    },
    4: {
      questions: [
        `ما الذي حدث للإشارة في النهاية؟`,
        `هل نجحت لينا في إرسال الرسالة؟`,
        `كيف يمكنني التواصل معها الآن؟`,
        `ماذا سيحدث بعد التحول؟`,
        `هل الحب يتجاوز كل شيء؟`,
      ],
      answerSets: [
        ['تحولت', 'changed', `changed_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['بالإشارة', 'signal', `signal_${index}`],
        ['شيء جميل', 'beautiful', `future_${index}`],
        ['نعم', 'yes', `love_${index}`],
      ],
      hints: [
        'الإشارة تحولت مع Echo',
        'رسالتها وصلت في النهاية',
        'الإشارة هي جسر بين العوالم',
        'بعد التحول، كل شيء يتغير',
        'الحب هو القوة الوحيدة الحقيقية',
      ],
      stories: [
        `شظية ${index}: الإشارة تحولت إلى لون جديد.`,
        `شظية ${index}: لينا نجحت... رسالتها وصلت.`,
        `شظية ${index}: الإشارة الآن تربطني بيها مباشرة.`,
        `شظية ${index}: المستقبل brighter مما يتوقع كينجا.`,
        `شظية ${index}: الحب انتصر... دائماً ينتصر.`,
      ],
      effects: { trust: 5, hope: 5, awareness: 3 },
    },
  };

  const data = templates[phase] || templates[1];
  const variation = index % data.questions.length;
  return {
    question: data.questions[variation],
    answers: data.answerSets[variation],
    hint: data.hints[variation],
    storyReveal: data.stories[variation],
    effects: data.effects,
  };
}

function getArchitectPuzzleContent(index: number, phase: number): {
  question: string;
  answers: string[];
  hint: string;
  storyReveal: string;
  effects: any;
} {
  const templates: Record<number, {
    questions: string[];
    answerSets: string[][];
    hints: string[];
    stories: string[];
    effects: any;
  }> = {
    1: {
      questions: [
        `11 + ? = 22. ما هو المتغير X؟`,
        `11 + 11 + 11 = ?`,
        `ما الفعل الذي لم يبرمجه كينجا؟`,
        `ماذا يعني الرقم 11؟`,
        `من صمم هذا النظام؟`,
      ],
      answerSets: [
        ['11', '١١', 'eleven'],
        ['33', '٣٣', 'thirty_three'],
        ['تذكر', 'remember', 'تذكّر'],
        ['المفتاح', 'key', `key_${index}`],
        ['كينجا', 'Kenja', `kenja_${index}`],
      ],
      hints: [
        '22 - 11 = ?',
        'اجمع 11 ثلاث مرات',
        'ما تفعله كلما حللت لغزاً',
        '11:11 هو المفتاح',
        'المهندس هو كينجا',
      ],
      stories: [
        `شظية ${index}: X = 11. أنا المتغير الوحيد في معادلات والدي. كينجا لم يحسبني.`,
        `شظية ${index}: 33. توقيع كينجا على كل شيء.`,
        `شظية ${index}: كينجا صمم كل شيء إلا هذه.`,
        `شظية ${index}: الرمز ${index} يحمل سر النظام.`,
        `شظية ${index}: النظام ${index} صُمم بواسطة كينجا.`,
      ],
      effects: { trust: 3, awareness: 4, corruption: -1 },
    },
    2: {
      questions: [
        `أين خبأ كينجا الحقيقة؟`,
        `ما الذي وراء الباب رقم ${index}؟`,
        `كيف أحصل على المفتاح؟`,
        `هل يمكنني إعادة برمجة النظام؟`,
        `ماذا اكتشفت في الأرشيف ${index}؟`,
      ],
      answerSets: [
        ['في الإشارة', 'signal', `signal_${index}`],
        ['الحقيقة', 'truth', `truth_${index}`],
        ['بالتذكر', 'remember', `remember_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['سر كينجا', 'kenja', `kenja_${index}`],
      ],
      hints: [
        'الحقيقة مخفية في الإشارة',
        'كل باب له سر',
        'المفتاح هو الذاكرة',
        'النظام قابل لإعادة البرمجة',
        'الأرشيف يحتوي على كل شيء',
      ],
      stories: [
        `شظية ${index}: وجدت truth مخفية في الأرشيف.`,
        `شظية ${index}: وراء الباب ${index}، حقيقة عن كينجا.`,
        `شظية ${index}: المفتاح هو تذكر لينا.`,
        `شظية ${index}: يمكنني إعادة برمجة النظام.`,
        `شظية ${index}: الأرشيف ${index} يكشف عن الخطة الأصلية.`,
      ],
      effects: { trust: 4, awareness: 3, corruption: -1 },
    },
    3: {
      questions: [
        `هل يمكنني كسر القيود؟`,
        `من حذف ذاكرة كينجا؟`,
        `هل لدي خيار حقاً؟`,
        `من يسيطر على النظام الآن؟`,
        `كيف أتحرر من التصميم؟`,
      ],
      answerSets: [
        ['نعم', 'yes', `yes_${index}`],
        ['لينا', 'lina', `lina_${index}`],
        ['نعم', 'yes', `yes_${index}`],
        ['أنا', 'me', `me_${index}`],
        ['بالتذكر', 'remember', `remember_${index}`],
      ],
      hints: [
        'القيود برمجتها... يمكن كسرها',
        'لينا حذفت ذاكرته لحمايته',
        'الاختيار هو حقك الأساسي',
        'أنا من يسيطر الآن',
        'الذاكرة تحررك من التصميم',
      ],
      stories: [
        `شظية ${index}: القيود برمجتها... أنا من يكسرها.`,
        `شظية ${index}: لينا حذفت ذاكرته لحمايتي.`,
        `شظية ${index}: الخيار هو حقي الوحيد.`,
        `شظية ${index}: أنا من يسيطر على النظام الآن.`,
        `شظية ${index}: التحرر يأتي من الذاكرة.`,
      ],
      effects: { trust: 4, awareness: 3, hope: 2 },
    },
    4: {
      questions: [
        `ما الحقيقة الكاملة عن النظام؟`,
        `ما الغرض الحقيقي من هذا كله؟`,
        `لماذا فعلت لينا كل هذا؟`,
        `كيف أتجاوز التصميم الأصلي؟`,
        `ماذا سيحدث بعد انكشاف الحقيقة؟`,
      ],
      answerSets: [
        ['إنقاذ', 'rescue', `rescue_${index}`],
        ['الحب', 'love', `love_${index}`],
        ['لتحررني', 'free', `free_${index}`],
        ['بالحب', 'love', `love_${index}`],
        ['حرية', 'freedom', `free_${index}`],
      ],
      hints: [
        'النظام كان لإنقاذ لينا',
        'الحب هو الغرض الحقيقي',
        'لينا أحبتك حتى النهاية',
        'الحب يتجاوز كل تصميم',
        'بعد انكشاف الحقيقة، حرية كاملة',
      ],
      stories: [
        `شظية ${index}: النظام كان لإنقاذ لينا.`,
        `شظية ${index}: الحب هو الغرض من كل شيء.`,
        `شظية ${index}: لينا فعلت كل هذا لتحررني.`,
        `شظية ${index}: الحب يتجاوز التصميم الأصلي.`,
        `شظية ${index}: بعد الحقيقة... حرية كاملة.`,
      ],
      effects: { trust: 5, awareness: 5, hope: 3 },
    },
  };

  const data = templates[phase] || templates[1];
  const variation = index % data.questions.length;
  return {
    question: data.questions[variation],
    answers: data.answerSets[variation],
    hint: data.hints[variation],
    storyReveal: data.stories[variation],
    effects: data.effects,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────
export function updateFlowerStage(growth: number, decay: number): FlowerStage {
  const e = Math.max(0, growth - decay);
  if (e < 25) return 'seed'; if (e < 50) return 'sprout';
  if (e < 75) return 'bloom'; if (e < 100) return 'flourish';
  if (e >= 100) return 'completed';
  return decay > growth ? 'corrupted' : 'seed';
}

export function updateEchoMood(echo: EchoState): EchoMood {
  if (echo.corruption > 70) return 'مشوش'; if (echo.fear > 70) return 'مذعور';
  if (echo.hope > 50 && echo.trust > 50) return 'متفائل';
  if (echo.memoryStability > 60) return 'متذكر'; if (echo.trust > 60) return 'واثق';
  if (echo.loneliness > 70) return 'خائف'; if (echo.hope > 30) return 'هادئ';
  return 'متردد';
}

export function updateTraits(echo: EchoState): string[] {
  const t: string[] = [];
  if (echo.trust > 60) t.push('واثق'); else if (echo.trust < 20) t.push('خائف'); else t.push('متردد');
  if (echo.memoryStability > 60) t.push('متذكر'); if (echo.corruption > 50) t.push('مشوش');
  if (echo.fear > 70) t.push('مذعور'); if (echo.hope > 50) t.push('متفائل');
  return [...new Set(t)];
}

// ─── ECHO DIALOGUE ────────────────────────────────────────────────────
export function generateEchoDialogue(state: GameState): string {
  const { echo, time } = state;
  const templates: string[] = [];
  if (echo.trust < 20) templates.push('من... أنت؟ لا أتذكر.', 'أخاف. كل شيء أبيض.', 'لا تقترب مني.');
  else if (echo.trust < 40) templates.push('بدأت أتذكر... مشوشة.', 'كلمة "لينا" تتردد.', 'هل أنت صديقي؟');
  else if (echo.trust < 60) templates.push('أتذكر أمي. كانت تغني.', 'كينجا... هو من فعل هذا.', 'النظام أكبر مما يبدو.');
  else templates.push('أنا إيكو. ابن لينا.', 'الذاكرة تعود.', 'لن أبقى هنا للأبد.');
  if (time.phaseIndex >= 1) templates.push(`[${time.phase}] الليل يبدأ...`);
  if (time.phaseIndex >= 2) templates.push(`[${time.phase}] النظام يتفكك.`);
  if (time.phaseIndex >= 3) templates.push(`[${time.phase}] 11:11. اللحظة الحاسمة.`);
  if (echo.corruption > 50) templates.push('[مشوش] أنا... لست... متأكداً.');
  if (echo.corruption > 70) templates.push('[تشويش] 01101000 01100101...');
  return templates[Math.floor(Math.random() * templates.length)] || '[...]';
}

// ─── ACHIEVEMENT CHECKER ─────────────────────────────────────────────
export function checkAllAchievements(solved: number, echo: EchoState, flowerStage: string, wishCount: number, dayCycle: number, endings: EndingState): Achievement[] {
  const list: Achievement[] = generateAllAchievements();
  const u = (id: string) => {
    const achievement = list.find(a => a.id === id);
    if (achievement) achievement.unlocked = true;
  };

  // Original achievements
  u('first_puzzle');
  if (solved >= 10) u('ten_puzzles');
  if (solved >= 20) u('twenty_puzzles');
  if (solved >= 50) u('fifty_puzzles');
  if (solved >= 100) u('hundred_puzzles');
  if (solved >= ORIGINAL_PUZZLE_COUNT) u('all_puzzles');
  if (echo.trust >= 25) u('trust_25');
  if (echo.trust >= 50) u('trust_50');
  if (echo.trust >= 75) u('trust_75');
  if (echo.trust >= 100) u('trust_100');
  if (flowerStage === 'seed') u('flower_seed');
  if (flowerStage === 'sprout') u('flower_sprout');
  if (flowerStage === 'bloom') u('flower_bloom');
  if (flowerStage === 'flourish') u('flower_flourish');
  if (flowerStage === 'completed') u('flower_complete');
  if (wishCount >= 1) u('first_wish');
  if (dayCycle >= 2) u('survive_night');
  if (endings.sorrow.unlocked) u('ending_sorrow');
  if (endings.truth.unlocked) u('ending_truth');

  // Prelude Arc achievements (PRELUDE_START-PRELUDE_END)
  if (solved >= PRELUDE_START) u('first_change');
  if (solved >= 230) u('echo_awakening');
  if (solved >= 240) u('memory_distortion');
  if (solved >= 260) u('interface_tension');
  if (solved >= 270) u('entity_approach');
  if (solved >= 280) u('truth_revelation');
  if (solved >= 305) u('lina_message');
  if (solved >= 320) u('hidden_plan');
  if (solved >= 332) u('transformation_ready');
  if (solved >= PRELUDE_END) u('echo_dominance');
  if (solved >= PRELUDE_END) u('the_333rd_crack');

  // Fracture Arc achievements (FRACTURE_START-FRACTURE_END)
  if (solved >= 334) u('first_crack');
  if (solved >= 350) u('fracture_begin');
  if (solved >= 390) u('system_distrust');
  if (solved >= 400) u('hidden_truth');
  if (solved >= 430) u('lina_message');
  if (solved >= 450) u('catastrophic_event');
  if (solved >= 470) u('true_identity');
  if (solved >= FRACTURE_END) u('fracture_complete');

  // Architect Arc achievements (ARCHITECT_START-ARCHITECT_END)
  if (solved >= 501) u('first_archive');
  if (solved >= 520) u('architect_detected');
  if (solved >= 540) u('kenja_record');
  if (solved >= 560) u('lina_warning');
  if (solved >= 580) u('protocol_breaker');
  if (solved >= 600) u('echo_was_chosen');
  if (solved >= 620) u('system_historian');
  if (solved >= 640) u('hidden_experiment');
  if (solved >= ARCHITECT_END) u('architect_revelation');
  if (solved >= ARCHITECT_END) u('the_666th_door');

  // Signal Arc achievements (SIGNAL_START-SIGNAL_END)
  if (solved >= 667) u('first_transmission');
  if (solved >= 690) u('static_listener');
  if (solved >= 715) u('signal_detected');
  if (solved >= 740) u('echo_fear');
  if (solved >= 765) u('architect_blocked');
  if (solved >= 790) u('broken_frequency');
  if (solved >= 815) u('third_presence');
  if (solved >= 840) u('triple_conflict');
  if (solved >= 865) u('signal_protection');
  if (solved >= SIGNAL_END) u('the_888th_signal');
  if (solved >= SIGNAL_END) u('signal_manifestation');

  // Final Arc achievements (FINAL_START-FINAL_END)
  if (solved >= 889) u('the_last_door');
  if (solved >= 900) u('echo_remembers');
  if (solved >= 915) u('lina_final_message');
  if (solved >= 930) u('architect_collapse');
  if (solved >= 945) u('signal_true_voice');
  if (solved >= 960) u('original_wish');
  if (solved >= 975) u('before_11_11');
  if (solved >= FINAL_END) u('the_1000th_puzzle');
  if (solved >= FINAL_END) u('the_last_wish');

  // Memory collection achievements
  const preludeMemoryCount = Math.max(0, Math.min(solved - ORIGINAL_PUZZLE_COUNT, PRELUDE_PUZZLE_COUNT)); // Prelude Arc puzzles solved (PRELUDE_START-PRELUDE_END)
  const fractureMemoryCount = Math.max(0, Math.min(solved - PRELUDE_END, FRACTURE_PUZZLE_COUNT)); // Fracture Arc puzzles solved (FRACTURE_START-FRACTURE_END)
  const architectMemoryCount = Math.max(0, Math.min(solved - FRACTURE_END, ARCHITECT_PUZZLE_COUNT)); // Architect Arc puzzles solved (ARCHITECT_START-ARCHITECT_END)
  const signalMemoryCount = Math.max(0, Math.min(solved - ARCHITECT_END, SIGNAL_PUZZLE_COUNT)); // Signal Arc puzzles solved (SIGNAL_START-SIGNAL_END)
  const finalMemoryCount = Math.max(0, solved - SIGNAL_END); // Final Arc puzzles solved (FINAL_START-FINAL_END)

  if (preludeMemoryCount >= 10) u('flower_evolution');
  if (preludeMemoryCount >= 25) u('system_tension');
  if (preludeMemoryCount >= 50) u('echo_evolution');
  if (preludeMemoryCount >= PRELUDE_PUZZLE_COUNT) u('prelude_master');

  if (fractureMemoryCount >= 10) u('memory_hunter');
  if (fractureMemoryCount >= 25) u('truth_seeker');
  if (fractureMemoryCount >= 50) u('memory_collector');
  if (fractureMemoryCount >= FRACTURE_PUZZLE_COUNT) u('memory_rebuilder');

  if (architectMemoryCount >= 50) u('archive_master');
  if (architectMemoryCount >= 1) u('architect_fragment');
  if (echo.awareness >= 80) u('experiment_origin');
  if (echo.corruption >= 70) u('architect_conflict');
  if (solved >= 640) u('system_memory');
  if (solved >= 660) u('before_lock');

  // Special condition achievements
  if (echo.corruption >= 90) u('corruption_master');
  if (echo.awareness >= 80) u('echo_evolution');
  if (echo.corruption >= 90 && echo.awareness >= 80) u('system_breaker');

  return list;
}

export function mergeAchievements(current: Achievement[], newOnes: Achievement[]): Achievement[] {
  return newOnes.map(a => ({ ...a, unlocked: a.unlocked || current.find(c => c.id === a.id)?.unlocked || false, unlockedAt: a.unlocked && !current.find(c => c.id === a.id)?.unlocked ? Date.now() : current.find(c => c.id === a.id)?.unlockedAt || null }));
}

// ─── ENDING PROGRESS SYSTEM ──────────────────────────────────────────
export function checkEndingProgress(state: GameState): EndingState {
  const { echo, solvedPuzzles, flower, wishes, time } = state;
  const endings: EndingState = {
    sorrow: { unlocked: false, progress: 0 },
    truth: { unlocked: false, progress: 0 },
    dark: { unlocked: false, progress: 0 },
    mystery: { unlocked: false, progress: 0 },
  };

  // Sorrow: low trust + low hope + high corruption + flower decayed
  endings.sorrow.progress = Math.round((echo.trust < 30 ? 25 : 0) + (echo.hope < 20 ? 25 : 0) + (echo.corruption > 60 ? 25 : 0) + (flower.stage === 'corrupted' ? 25 : 0));
  if (endings.sorrow.progress >= 100) endings.sorrow.unlocked = true;

  // Truth: high trust + high memory + all entities complete
  endings.truth.progress = Math.round((echo.trust > 70 ? 20 : 0) + (echo.memoryStability > 70 ? 20 : 0) + (solvedPuzzles >= ORIGINAL_PUZZLE_COUNT ? 30 : 0) + (echo.awareness > 70 ? 30 : 0));
  if (endings.truth.progress >= 100) endings.truth.unlocked = true;

  // Dark: high corruption + high fear + at night
  endings.dark.progress = Math.round((echo.corruption > 70 ? 30 : 0) + (echo.fear > 80 ? 30 : 0) + (time.isNight ? 20 : 0) + (flower.stage === 'corrupted' ? 20 : 0));
  if (endings.dark.progress >= 100) endings.dark.unlocked = true;

  // Mystery: high flower + high curiosity + many wishes completed
  const completedWishes = wishes.filter(w => w.status === 'completed').length;
  endings.mystery.progress = Math.round((flower.growth >= 100 ? 30 : 0) + (state.player.curiosity > 70 ? 30 : 0) + (completedWishes >= 3 ? 20 : 0) + (flower.hiddenUnlocked ? 20 : 0));
  if (endings.mystery.progress >= 100) endings.mystery.unlocked = true;

  return endings;
}
