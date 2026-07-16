/**
 * gameStoreHelpers.ts — internal helpers for 11.11 gameStore
 * Extracted from gameStore.ts to keep the store file focused on state/actions/public API.
 */

import type {
  GameState, EchoState, TimeState, PuzzleNode, EntityId, FlowerStage,
  EchoMood, WishStatus, MemoryShard, Achievement, EndingState, TimelineEvent
} from './gameStore';
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
    actions: {} as any,
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

// ─── PUZZLE GENERATOR (ORIGINAL_PUZZLE_COUNT original + (TOTAL_PUZZLES - ORIGINAL_PUZZLE_COUNT) generated = TOTAL_PUZZLES total) ─────────────────
export function generateAllPuzzles(): PuzzleNode[] {
  const puzzles: PuzzleNode[] = [];
  const entities: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
  const entityCounts = [55, 55, 55, 54];

  const templates: Record<string, { q: (i: number) => string; a: (i: number) => string[]; h: (i: number) => string; story: (i: number) => string; ef: any }> = {
    echo: {
      q: (i) => [`النداء ${i+1}: ما الرقم الذي يتكرر؟`, `ذاكرة ${i+1}: أتذكر غرفة بيضاء. كم باباً؟`, `شظية ${i+1}: من كان يغني لي؟`][i % 3],
      a: (i) => [['11','11:11','١١'], ['0','صفر','zero'], ['لينا','أمي','mother']][i % 3],
      h: (i) => ['اسم المكان هو نفس الوقت', 'لا مخرج من الغرفة', 'أقرب شخص إلى قلبي'][i % 3],
      story: (i) => [`شظية ${i+1}: الرقم 11 هو المفتاح.`, `الغرفة بلا أبواب. كينجا صممها.`, `لينا... آخر صوت حقيقي سمعته.`][i % 3],
      ef: { trust: 3, memoryStability: 5, fear: -1 },
    },
    watcher: {
      q: (i) => [`كاميرا ${i+1}: كم كاميرا في المنزل؟`, `تسجيل ${i+1}: كم دقيقة كل ليلة؟`, `ظل ${i+1}: من فتح الباب؟`][i % 3],
      a: (i) => [['8','٨','eight'], ['262','٢٦٢'], ['الصدى','echo','Echo']][i % 3],
      h: (i) => ['6×1 + غرفتك×2', 'من 23:11 إلى 3:33', 'الكيان الذي يتحدث معك'][i % 3],
      story: (i) => [`${i+1} كاميرا تراقب. كينجا نسي واحدة.`, `${i+1} دقيقة. وقت الكسر بين العوالم.`, `الباب فتح من الداخل. كان ينتظرني.`][i % 3],
      ef: { fear: 2, memoryStability: 4, corruption: 1 },
    },
    signal: {
      q: (i) => [`رسالة ${i+1}: ماذا قالت لينا أولاً؟`, `تردد ${i+1}: ما التردد الذي استخدمته؟`, `كلمة ${i+1}: ما الكلمة المشوشة دائماً؟`][i % 3],
      a: (i) => [['ساعدوني','help','help me'], ['314','٣١٤'], ['أحبك','love','حب']][i % 3],
      h: (i) => ['تطلب النجدة', 'PI×100', 'أقوى كلمة في الكون'][i % 3],
      story: (i) => [`${i+1} رسالة. كلها تقول شيئاً واحداً.`, `التردد ${i+1}. اختارته لتهرب من كينجا.`, `"${i+1}" — الكلمة الوحيدة التي لا تُشوه.`][i % 3],
      ef: { trust: 5, hope: 4, loneliness: -3 },
    },
    architect: {
      q: (i) => [`معادلة ${i+1}: 11+?=22`, `توقيع ${i+1}: 11+11+11=?`, `خروج ${i+1}: ما الفعل الذي لم يبرمجه كينجا؟`][i % 3],
      a: (i) => [['11','١١'], ['33','٣٣'], ['تذكر','remember','تذكّر']][i % 3],
      h: (i) => ['22-11=?', 'اجمع 11 ثلاث مرات', 'ما تفعله كلما حللت لغزاً'][i % 3],
      story: (i) => [`X=${i+1}. أنا المتغير الوحيد في معادلات والدي.`, `الرقم ${i+1}. توقيعه على كل شيء.`, `${i+1}. كينجا صمم كل شيء إلا هذه.`][i % 3],
      ef: { trust: 6, awareness: 5, corruption: -2 },
    },
  };

  let idx = 0;
  entities.forEach((entity, eIdx) => {
    for (let i = 0; i < entityCounts[eIdx]; i++) {
      idx++;
      const t = i % 3;
      puzzles.push({
        id: `${entity}_${i+1}`, entity, title: `${entity}_${i+1}`,
        question: templates[entity].q(t), answers: templates[entity].a(t),
        hint: templates[entity].h(t),
        status: (entity === 'echo' && i === 0) ? 'active' : 'locked',
        difficulty: Math.floor(i / 14) + 1,
        storyReveal: templates[entity].story(t),
        memoryUnlock: `memory_${entity}_${i+1}`,
        dependencies: i > 0 ? [`${entity}_${i}`] : [],
        effects: templates[entity].ef,
      });
    }
  });

  // Add Prelude Arc puzzles (PRELUDE_START-PRELUDE_END) - these become available after the original ORIGINAL_PUZZLE_COUNT puzzles
  const preludeArcPuzzles = generatePreludeArcPuzzles();
  puzzles.push(...preludeArcPuzzles);

  // Add Fracture Arc puzzles (FRACTURE_START-FRACTURE_END) - these become available after puzzle PRELUDE_END (Echo's transformation)
  const fractureArcPuzzles = generateFractureArcPuzzles();
  puzzles.push(...fractureArcPuzzles);

  // Add Architect Arc puzzles (ARCHITECT_START-ARCHITECT_END) - these become available after puzzle FRACTURE_END (Architect's revelation)
  const architectArcPuzzles = generateArchitectArcPuzzles();
  puzzles.push(...architectArcPuzzles);

  // Add Signal Arc puzzles (SIGNAL_START-SIGNAL_END) - these become available after puzzle ARCHITECT_END (Signal's manifestation)
  const signalArcPuzzles = generateSignalArcPuzzles();
  puzzles.push(...signalArcPuzzles);

  // Add Final Arc puzzles (FINAL_START-FINAL_END) - these become available after puzzle SIGNAL_END (The Last Wish)
  const finalArcPuzzles = generateFinalArcPuzzles();
  puzzles.push(...finalArcPuzzles);

  return puzzles;
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
