/**
 * gameStoreHelpers.ts — internal helpers for 11.11 gameStore
 * Updated v4.0: Now uses new puzzle generator and Echo transformation system
 */

import type {
  GameState, EchoState, TimeState, PuzzleNode, ChapterId, FlowerStage,
  EchoMood, WishStatus, Achievement, EndingState, TimelineEvent, PuzzleStatus, ChapterState
} from '../core/gameTypes';
import type { MemoryShard } from '../core/memoryShardsTypes';
import { getCollectedShards, ALL_MEMORY_SHARDS } from '../core/memoryShardsSystem';
import {
  ORIGINAL_PUZZLE_COUNT,
  TOTAL_PUZZLES,
  TOTAL_MEMORY_SHARDS,
} from '../constants/puzzleConstants';
import {
  getPuzzleByNumber,
  getAllPuzzles,
} from '../core/puzzles/puzzleBank';
import {
  createInitialTransformationState,
  determineStage,
  getEchoDialogueByStage,
  determineEnding,
  getEndingDescription,
  calculateTransformationEffects,
  applyTransformation
} from '../core/echoTransformationSystem';
import { CHAPTER_DATASETS, CHAPTER_ORDER } from '../core/chapterSystem';
import { STORY_ARCS } from '../core/storyActs';

// ─── INITIAL STATE ─────────────────────────────────────────────────────
export function buildInitialState(): GameState {
  const initialTransformation = createInitialTransformationState();
  
  return {
    echo: {
      trust: 15, fear: 70, memoryStability: 5, corruption: 2,
      hope: 20, loneliness: 80, awareness: 3, isolation: 0,
      mood: 'خائف', personalityTraits: ['خائف', 'متردد'],
      lastDialogue: '', dialogueHistory: [],
      level: 1, xp: 0, xpMax: 100, xpMultiplier: 1,
      // Currency system
      coins: 100,                    // يبدأ بـ 100 عملة كهدية ترحيب
      crystals: 0,
      usedHints: [],
      skippedPuzzles: [],
      rerolledPuzzles: [],
      // New transformation fields
      transformationStage: initialTransformation.currentStage,
      ragePoints: initialTransformation.ragePoints,
      forgivenessPoints: initialTransformation.forgivenessPoints,
    },
    time: { phase: 'morning', phaseIndex: 0, isNight: false, hour: 8, minute: 0, dayCycle: 1 },
    flower: { stage: 'seed', growth: 0, decay: 0, hiddenUnlocked: false, maxStage: 5 },
    memory: { fragmentsCollected: 0, totalFragments: TOTAL_MEMORY_SHARDS, corruptedFragments: 0, timelineEvents: [], logsUnlocked: [] },
    allMemoryShards: [],
    puzzles: [], // Will be populated by chapter datasets
    totalPuzzles: TOTAL_PUZZLES, solvedPuzzles: 0,
    finalChoice: null,
    unlockedEndings: [],
    seenEndings: [],
    achievedEnding: null,
    lastEndingViewed: null,
    chapters: Object.fromEntries(
      CHAPTER_ORDER.map(id => [
        id,
        {
          id,
          title: CHAPTER_DATASETS[id].title,
          description: CHAPTER_DATASETS[id].description,
          glyph: CHAPTER_DATASETS[id].glyph,
          color: CHAPTER_DATASETS[id].color,
          unlocked: id === 'chapter_1',
          completed: false,
          puzzlesSolved: 0,
          totalPuzzles: CHAPTER_DATASETS[id].puzzles.length,
          progress: 0,
        } as ChapterState,
      ])
    ) as Record<ChapterId, ChapterState>,
    currentChapter: 'chapter_1',
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
    dailyMissions: [],
    lastMissionRefresh: 0,
    shopPrices: { hintPrice: 50, skipPrice: 100, rerollPrice: 150, extraHintPrice: 30, rareShardPrice: 200 },
    actions: {} as GameState['actions'],
  };
}

// ─── ACHIEVEMENTS (24 + story-based) ─────────────────────────────────
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
      { id: 'ending_dark', name: 'الظلام', desc: 'وصلت لنهاية الظلام', icon: '🌑', unlocked: false, unlockedAt: null },
      { id: 'ending_mystery', name: 'الغموض', desc: 'وصلت للنهاية الغامضة', icon: '🔮', unlocked: false, unlockedAt: null },
      
      // Transformation achievements
      { id: 'echo_fractured', name: 'التحول', desc: 'إيكو يتحول للجانب المظلم', icon: '👹', unlocked: false, unlockedAt: null },
      { id: 'echo_redeemed', name: 'الفداء', desc: 'إيكو يسامح ويعود للخير', icon: '😇', unlocked: false, unlockedAt: null },
      { id: 'echo_ascended', name: 'التسامي', desc: 'إيكو يصل للوعي الكامل', icon: '✨', unlocked: false, unlockedAt: null },
      { id: 'vengeance_ending', name: 'الانتقام', desc: 'نهاية الانتقام', icon: '⚔️', unlocked: false, unlockedAt: null },
      { id: 'redemption_ending', name: 'الفداء', desc: 'نهاية الفداء', icon: '💚', unlocked: false, unlockedAt: null },
      
      // Story arc achievements
      { id: 'act1_complete', name: 'الصحوة', desc: 'أكمل الفصل الأول', icon: '🌟', unlocked: false, unlockedAt: null },
      { id: 'act2_complete', name: 'الاكتشاف', desc: 'أكمل الفصل الثاني', icon: '🗺️', unlocked: false, unlockedAt: null },
      { id: 'act3_complete', name: 'الاتصال', desc: 'أكمل الفصل الثالث', icon: '💌', unlocked: false, unlockedAt: null },
      { id: 'act4_complete', name: 'الحقيقة', desc: 'أكمل الفصل الرابع', icon: '💡', unlocked: false, unlockedAt: null },
      { id: 'act5_complete', name: 'الكسر', desc: 'أكمل الفصل الخامس', icon: '💥', unlocked: false, unlockedAt: null },
      { id: 'act6_complete', name: 'الثأر', desc: 'أكمل الفصل السادس', icon: '🔥', unlocked: false, unlockedAt: null },
      { id: 'act7_complete', name: 'الخاتمة', desc: 'أكمل الفصل السابع', icon: '🏆', unlocked: false, unlockedAt: null },
      
      // Secret achievements
      { id: 'secret_lina', name: 'رسالة لينا', desc: 'اكتشف كل رسائل لينا', icon: '💝', unlocked: false, unlockedAt: null },
      { id: 'secret_kenja', name: 'ندم كينجا', desc: 'اكتشف قصة كينجا الكاملة', icon: '📖', unlocked: false, unlockedAt: null },
      { id: 'secret_flower', name: 'الزهرة المفقودة', desc: 'اكتشف السر الخفي للزهرة', icon: '🌺', unlocked: false, unlockedAt: null },
      
      // Level achievements
      { id: 'level_5', name: 'مستوى 5', desc: 'وصلت للمستوى 5', icon: '⭐', unlocked: false, unlockedAt: null },
      { id: 'level_10', name: 'مستوى 10', desc: 'وصلت للمستوى 10', icon: '🌟', unlocked: false, unlockedAt: null },
      { id: 'level_20', name: 'مستوى 20', desc: 'وصلت للمستوى 20', icon: '💫', unlocked: false, unlockedAt: null },
      { id: 'level_50', name: 'مستوى 50', desc: 'وصلت للمستوى 50', icon: '🏆', unlocked: false, unlockedAt: null },
      
      // Shard achievements
      { id: 'shard_collector', name: 'جامع الشظايا', desc: 'اجمع 5 شظيات ذاكرة', icon: '🧩', unlocked: false, unlockedAt: null },
      { id: 'shard_master', name: 'سيد الشظايا', desc: 'اجمع كل الشظيات', icon: '👁️', unlocked: false, unlockedAt: null },
    ];

    cachedAllAchievements = [...originalAchievements];
  }
  return cachedAllAchievements.map(a => ({ ...a }));
}

// ─── PUZZLE GENERATOR (MANUAL ONLY) ──────────────────────────────
export function generateAllPuzzles(): PuzzleNode[] {
  return getAllPuzzles().map((manual, idx) => {
    const puzzleNumber = idx + 1;
    const previousPuzzleId = idx > 0 ? getAllPuzzles()[idx - 1].id : null;
    const chapterId = getChapterForPuzzleNumber(puzzleNumber);
    return {
      id: manual.id,
      chapterId,
      title: manual.id,
      question: manual.question,
      answers: manual.answers,
      hint: manual.hints[0] || '',
      status: puzzleNumber === 1 ? 'active' : 'locked',
      difficulty: manual.difficulty,
      storyReveal: manual.storyReveal,
      memoryUnlock: manual.shardId ? `memory_${manual.shardId}` : null,
      dependencies: previousPuzzleId ? [previousPuzzleId] : [],
      effects: manual.effects,
      act: manual.act,
      phase: manual.phase as any,
      hints: manual.hints,
      puzzleType: manual.type,
    };
  });
}

export function ensurePuzzleGenerated(state: GameState, puzzleNumber: number): PuzzleNode {
  const id = `puzzle_${puzzleNumber}`;
  const existing = state.puzzles.find(p => p.id === id);
  if (existing) return existing;

  const manual = getPuzzleByNumber(puzzleNumber);
  if (!manual) {
    throw new Error(`No manual puzzle found for puzzle #${puzzleNumber}. Add it to batch_01.ts`);
  }
  const previousPuzzleId = puzzleNumber > 1 ? getPuzzleByNumber(puzzleNumber - 1)?.id : null;
  const chapterId = getChapterForPuzzleNumber(puzzleNumber);

  const newNode: PuzzleNode = {
    id: manual.id,
    chapterId,
    title: manual.id,
    question: manual.question,
    answers: manual.answers,
    hint: manual.hints[0] || '',
    status: puzzleNumber === 1 && !state.puzzles.find(q => q.status === 'active')
      ? ('active' as PuzzleStatus)
      : ('locked' as PuzzleStatus),
    difficulty: manual.difficulty,
    storyReveal: manual.storyReveal,
    memoryUnlock: manual.shardId ? `memory_${manual.shardId}` : null,
    dependencies: previousPuzzleId ? [previousPuzzleId] : [],
    effects: manual.effects,
    act: manual.act,
    phase: manual.phase as any,
    hints: manual.hints,
    puzzleType: manual.type,
  };

  return newNode;
}

function getChapterForPuzzleNumber(puzzleNumber: number): ChapterId {
  // Distribute puzzles across chapters based on puzzle number
  // This is a simple distribution - can be made more sophisticated later
  if (puzzleNumber <= 400) return 'chapter_1';
  if (puzzleNumber <= 800) return 'chapter_2';
  if (puzzleNumber <= 1200) return 'chapter_3';
  if (puzzleNumber <= 1600) return 'chapter_4';
  return 'chapter_5';
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
  
  // Use transformation-based dialogue if available
  const stageDialogues = getEchoDialogueByStage(echo.transformationStage || 'innocent');
  if (stageDialogues && stageDialogues.length > 0) {
    const templates = [...stageDialogues];
    if (time.phaseIndex >= 1) templates.push(`[${time.phase}] الليل يبدأ...`);
    if (time.phaseIndex >= 2) templates.push(`[${time.phase}] النظام يتفكك.`);
    if (time.phaseIndex >= 3) templates.push(`[${time.phase}] 11:11. اللحظة الحاسمة.`);
    if (echo.corruption > 50) templates.push('[مشوش] أنا... لست... متأكداً.');
    return templates[Math.floor(Math.random() * templates.length)] || '[...]';
  }
  
  // Fallback to old system
  const templates: string[] = [];
  if (echo.trust < 20) templates.push('من... أنت؟ لا أتذكر.', 'أخاف. كل شيء أبيض.', 'لا تقترب مني.');
  else if (echo.trust < 40) templates.push('بدأت أتذكر... مشوشة.', 'كلمة "لينا" تتردد.', 'هل أنت صديقي؟');
  else if (echo.trust < 60) templates.push('أتذكر أمي. كانت تغني.', 'كينجا... هو من فعل هذا.', 'النظام أكبر مما يبدو.');
  else templates.push('أنا إيكو. ابن لينا.', 'الذاكرة تعود.', 'لن أبقى هنا للأبد.');
  if (time.phaseIndex >= 1) templates.push(`[${time.phase}] الليل يبدأ...`);
  if (time.phaseIndex >= 2) templates.push(`[${time.phase}] النظام يتفكك.`);
  if (time.phaseIndex >= 3) templates.push(`[${time.phase}] 11:11. اللحظة الحاسمة.`);
  if (echo.corruption > 50) templates.push('[مشوش] أنا... لست... متأكداً.');
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
  if (endings.dark.unlocked) u('ending_dark');
  if (endings.mystery.unlocked) u('ending_mystery');

  // Transformation achievements
  if (echo.transformationStage === 'fractured' || echo.transformationStage === 'vengeful') u('echo_fractured');
  if (echo.transformationStage === 'redeemed') u('echo_redeemed');
  if (echo.transformationStage === 'ascended') u('echo_ascended');

  // Story arc achievements — derived dynamically from STORY_ARCS
  STORY_ARCS.forEach(arc => {
    const actId = `act${arc.act}_complete`;
    if (solved >= arc.puzzleRange[1]) u(actId);
  });
  
  // Level achievements
  if (echo.level >= 5) u('level_5');
  if (echo.level >= 10) u('level_10');
  if (echo.level >= 20) u('level_20');
  if (echo.level >= 50) u('level_50');

  // Shard achievements
  const collected = getCollectedShards();
  if (collected.length >= 5) u('shard_collector');
  if (collected.length >= ALL_MEMORY_SHARDS.length) u('shard_master');

  return list;
}

export function mergeAchievements(current: Achievement[], newOnes: Achievement[]): Achievement[] {
  return newOnes.map(a => ({
    ...a,
    unlocked: a.unlocked || current.find(c => c.id === a.id)?.unlocked || false,
    unlockedAt: a.unlocked && !current.find(c => c.id === a.id)?.unlocked ? Date.now() : current.find(c => c.id === a.id)?.unlockedAt || null
  }));
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
  endings.sorrow.progress = Math.round(
    (echo.trust < 30 ? 25 : 0) + (echo.hope < 20 ? 25 : 0) + 
    (echo.corruption > 60 ? 25 : 0) + (flower.stage === 'corrupted' ? 25 : 0)
  );
  if (endings.sorrow.progress >= 100) endings.sorrow.unlocked = true;

  // Truth: high trust + high memory + high awareness
  endings.truth.progress = Math.round(
    (echo.trust > 70 ? 20 : 0) + (echo.memoryStability > 70 ? 20 : 0) + 
    (solvedPuzzles >= 600 ? 30 : 0) + (echo.awareness > 70 ? 30 : 0)
  );
  if (endings.truth.progress >= 100) endings.truth.unlocked = true;

  // Dark: high corruption + high fear + at night
  endings.dark.progress = Math.round(
    (echo.corruption > 70 ? 30 : 0) + (echo.fear > 80 ? 30 : 0) + 
    (time.isNight ? 20 : 0) + (flower.stage === 'corrupted' ? 20 : 0)
  );
  if (endings.dark.progress >= 100) endings.dark.unlocked = true;

  // Mystery: high flower + high curiosity + many wishes completed
  const completedWishes = wishes.filter(w => w.status === 'completed').length;
  endings.mystery.progress = Math.round(
    (flower.growth >= 100 ? 30 : 0) + (state.player.curiosity > 70 ? 30 : 0) + 
    (completedWishes >= 3 ? 20 : 0) + (flower.hiddenUnlocked ? 20 : 0)
  );
  if (endings.mystery.progress >= 100) endings.mystery.unlocked = true;

  return endings;
}