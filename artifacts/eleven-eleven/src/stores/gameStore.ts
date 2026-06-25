/**
 * gameStore.ts — محرك الحالة المركزي لـ 11.11 (v3.0)
 * ALL 18 SYSTEMS: Echo, Puzzles(219), Entities(4), Flowers, Memory, Wishes,
 * Time(08:00→11:11), Morning, Day, Evening, Night, Progression,
 * Endings(4), World, Player, Achievements(24), Save/Load, Dialogue
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateFractureArcPuzzles, generateFractureMemoryShards, generateFractureCinematicScenes, generateFractureAchievements, FractureArcData } from '../core/echoFractureArc';
import { generatePreludeArcPuzzles, generatePreludeMemoryShards, generatePreludeCinematicScenes, generatePreludeAchievements, PreludeArcData } from '../core/echoTransformationPreludeArc';
import { generateArchitectArcPuzzles, generateArchitectMemoryShards, generateArchitectCinematicScenes, generateArchitectAchievements, ArchitectArcData } from '../core/echoArchitectArc';
import { generateSignalArcPuzzles, generateSignalMemoryShards, generateSignalCinematicScenes, generateSignalAchievements, SignalArcData } from '../core/echoSignalArc';
import { generateFinalArcPuzzles, generateFinalMemoryShards, generateFinalCinematicScenes, generateFinalAchievements, FinalArcData, ExpandedEndingSystem } from '../core/echoFinalArc';

// ─── TYPES ────────────────────────────────────────────────────────────
export type TimePhase = 'morning' | 'day' | 'evening' | '11:00' | '11:05' | '11:11';
export type EntityId = 'echo' | 'watcher' | 'signal' | 'architect';
export type PuzzleStatus = 'locked' | 'active' | 'solved' | 'failed';
export type FlowerStage = 'seed' | 'sprout' | 'bloom' | 'flourish' | 'completed' | 'corrupted';
export type Ending = 'sorrow' | 'truth' | 'dark' | 'mystery';
export type EchoMood = 'خائف' | 'متردد' | 'واثق' | 'متذكر' | 'مشوش' | 'مذعور' | 'هادئ' | 'متفائل';
export type WishStatus = 'active' | 'completed' | 'failed';

export interface EchoState {
  trust: number; fear: number; memoryStability: number; corruption: number;
  hope: number; loneliness: number; awareness: number;
  mood: EchoMood; personalityTraits: string[];
  lastDialogue: string; dialogueHistory: string[];
  level: number; xp: number;
}

export interface TimeState {
  phase: TimePhase; phaseIndex: number; isNight: boolean;
  hour: number; minute: number; dayCycle: number;
}

export interface PuzzleNode {
  id: string; entity: EntityId; title: string;
  question: string; answers: string[]; hint: string;
  status: PuzzleStatus; difficulty: number;
  storyReveal: string; memoryUnlock: string | null;
  dependencies: string[];
  effects: { trust?: number; fear?: number; memoryStability?: number; corruption?: number; hope?: number; flower?: number; awareness?: number; };
}

export interface EntityState {
  id: EntityId; name: string; glyph: string;
  unlocked: boolean; completed: boolean;
  puzzlesSolved: number; totalPuzzles: number;
  dialogueProgress: number; loreUnlocked: string[];
}

export interface FlowerState {
  stage: FlowerStage; growth: number; decay: number;
  hiddenUnlocked: boolean; maxStage: number;
}

export interface WishNode {
  id: string; text: string; progress: number;
  status: WishStatus; createdAt: string;
  storyImpact: number; // 0-100, affects ending
}

export interface MemoryState {
  fragmentsCollected: number; totalFragments: number;
  corruptedFragments: number;
  timelineEvents: TimelineEvent[]; logsUnlocked: string[];
}

export interface TimelineEvent {
  id: string; time: string; phase: TimePhase;
  description: string; type: 'memory' | 'puzzle' | 'chat' | 'night' | 'achievement' | 'ending';
}

export interface Achievement {
  id: string; name: string; desc: string; icon: string;
  unlocked: boolean; unlockedAt: number | null;
}

export interface EndingState {
  sorrow: { unlocked: boolean; progress: number; };
  truth: { unlocked: boolean; progress: number; };
  dark: { unlocked: boolean; progress: number; };
  mystery: { unlocked: boolean; progress: number; };
}

export interface GameState {
  echo: EchoState; time: TimeState; flower: FlowerState;
  memory: MemoryState; puzzles: PuzzleNode[];
  totalPuzzles: number; solvedPuzzles: number;
  entities: Record<EntityId, EntityState>; currentEntity: EntityId;
  wishes: WishNode[];
  player: { curiosity: number; interactions: number; choices: string[]; };
  world: { stability: number; glitchLevel: number; corruptionLevel: number; anomalyCount: number; };
  achievements: Achievement[];
  endings: EndingState;
  narrativeTriggers: Record<string, boolean>;
  finalChoice: string | null;
  unlockedEndings: string[];
  seenEndings: string[];
  achievedEnding: string | null;
  lastEndingViewed: string | null;
  actions: {
    chat: () => { dialogue: string; effects: Partial<EchoState>; };
    solve: (puzzleId: string, answer: string) => { success: boolean; message: string; achievement?: Achievement; };
    advanceTime: () => void;
    addWish: (text: string) => void;
    completeWish: (wishId: string) => void;
    checkEndings: () => void;
    makeFinalChoice: (choice: string) => void;
    resetGame: () => void;
    replayEnding: (endingId: string) => void;
  };
}

// ─── INITIAL STATE ─────────────────────────────────────────────────────
const initialState: GameState = {
  echo: {
    trust: 15, fear: 70, memoryStability: 5, corruption: 2,
    hope: 20, loneliness: 80, awareness: 3,
    mood: 'خائف', personalityTraits: ['خائف', 'متردد'],
    lastDialogue: '', dialogueHistory: [],
    level: 1, xp: 0,
  },
  time: { phase: 'morning', phaseIndex: 0, isNight: false, hour: 8, minute: 0, dayCycle: 1 },
  flower: { stage: 'seed', growth: 0, decay: 0, hiddenUnlocked: false, maxStage: 5 },
  memory: { fragmentsCollected: 0, totalFragments: 54 + 114 + 167 + 166 + 222 + 112, corruptedFragments: 0, timelineEvents: [], logsUnlocked: [] },
  puzzles: [], totalPuzzles: 1000, solvedPuzzles: 0,
  finalChoice: null as string | null,
  unlockedEndings: [] as string[],
  seenEndings: [] as string[],
  achievedEnding: null as string | null,
  lastEndingViewed: null as string | null,
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

// ─── ACHIEVEMENTS (24 + 20 = 44) ────────────────────────────────────────────────
function generateAllAchievements(): Achievement[] {
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
  return [...originalAchievements, ...preludeArcAchievements, ...fractureArcAchievements, ...architectArcAchievements, ...signalArcAchievements, ...finalArcAchievements];
}

// ─── PUZZLE GENERATOR (219 + 167 = 386) ───────────────────────────────────────────
function generateAllPuzzles(): PuzzleNode[] {
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

  // Add Prelude Arc puzzles (220-333) - these become available after the original 219 puzzles
  const preludeArcPuzzles = generatePreludeArcPuzzles();
  puzzles.push(...preludeArcPuzzles);

  // Add Fracture Arc puzzles (334-500) - these become available after puzzle 333 (Echo's transformation)
  const fractureArcPuzzles = generateFractureArcPuzzles();
  puzzles.push(...fractureArcPuzzles);

  // Add Architect Arc puzzles (501-666) - these become available after puzzle 500 (Architect's revelation)
  const architectArcPuzzles = generateArchitectArcPuzzles();
  puzzles.push(...architectArcPuzzles);

  // Add Signal Arc puzzles (667-888) - these become available after puzzle 666 (Signal's manifestation)
  const signalArcPuzzles = generateSignalArcPuzzles();
  puzzles.push(...signalArcPuzzles);

  // Add Final Arc puzzles (889-1000) - these become available after puzzle 888 (The Last Wish)
  const finalArcPuzzles = generateFinalArcPuzzles();
  puzzles.push(...finalArcPuzzles);

  return puzzles;
}

// ─── HELPERS ──────────────────────────────────────────────────────────
function updateFlowerStage(growth: number, decay: number): FlowerStage {
  const e = Math.max(0, growth - decay);
  if (e < 25) return 'seed'; if (e < 50) return 'sprout';
  if (e < 75) return 'bloom'; if (e < 100) return 'flourish';
  if (e >= 100) return 'completed';
  return decay > growth ? 'corrupted' : 'seed';
}

function updateEchoMood(echo: EchoState): EchoMood {
  if (echo.corruption > 70) return 'مشوش'; if (echo.fear > 70) return 'مذعور';
  if (echo.hope > 50 && echo.trust > 50) return 'متفائل';
  if (echo.memoryStability > 60) return 'متذكر'; if (echo.trust > 60) return 'واثق';
  if (echo.loneliness > 70) return 'خائف'; if (echo.hope > 30) return 'هادئ';
  return 'متردد';
}

function updateTraits(echo: EchoState): string[] {
  const t: string[] = [];
  if (echo.trust > 60) t.push('واثق'); else if (echo.trust < 20) t.push('خائف'); else t.push('متردد');
  if (echo.memoryStability > 60) t.push('متذكر'); if (echo.corruption > 50) t.push('مشوش');
  if (echo.fear > 70) t.push('مذعور'); if (echo.hope > 50) t.push('متفائل');
  return [...new Set(t)];
}

// ─── ECHO DIALOGUE ────────────────────────────────────────────────────
function generateEchoDialogue(state: GameState): string {
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

// ─── STORE ────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      puzzles: generateAllPuzzles(),

      // ─── ACTIONS ──────────────────────────────────────────────────────
      actions: {
        // 💬 CHAT
        chat: () => {
          const state = get();
          const dialogue = generateEchoDialogue(state);
          const effects = { trust: Math.min(100, state.echo.trust + 3), fear: Math.max(0, state.echo.fear - 2), hope: Math.min(100, state.echo.hope + 2), loneliness: Math.max(0, state.echo.loneliness - 3) };
          const newEcho = { ...state.echo, ...effects, mood: updateEchoMood({ ...state.echo, ...effects }), lastDialogue: dialogue, dialogueHistory: [...state.echo.dialogueHistory.slice(-50), dialogue], personalityTraits: updateTraits({ ...state.echo, ...effects }), xp: state.echo.xp + 10 };
          const newTriggers = { ...state.narrativeTriggers, first_chat: true };
          const newAchievements = checkAllAchievements(state.solvedPuzzles, newEcho, state.flower.stage, state.wishes.length, state.time.dayCycle, state.endings);
          set({ echo: newEcho, player: { ...state.player, interactions: state.player.interactions + 1 }, narrativeTriggers: newTriggers, achievements: mergeAchievements(state.achievements, newAchievements) });
          return { dialogue, effects };
        },

        // 🧩 SOLVE PUZZLE
        solve: (puzzleId: string, answer: string) => {
          const state = get();
          const puzzle = state.puzzles.find(p => p.id === puzzleId);
          if (!puzzle) return { success: false, message: 'اللغز غير موجود' };
          if (puzzle.status === 'solved') return { success: false, message: 'تم سابقاً' };
          if (!puzzle.answers.some(a => answer.trim().toLowerCase().includes(a))) return { success: false, message: '✕ خطأ' };

          const ef = puzzle.effects;
          const newEcho = { ...state.echo };
          if (ef.trust) newEcho.trust = Math.min(100, Math.max(0, newEcho.trust + ef.trust));
          if (ef.fear) newEcho.fear = Math.min(100, Math.max(0, newEcho.fear + ef.fear));
          if (ef.memoryStability) newEcho.memoryStability = Math.min(100, Math.max(0, newEcho.memoryStability + ef.memoryStability));
          if (ef.corruption) newEcho.corruption = Math.min(100, Math.max(0, newEcho.corruption + ef.corruption));
          if (ef.hope) newEcho.hope = Math.min(100, Math.max(0, newEcho.hope + ef.hope));
          newEcho.xp += 25; newEcho.mood = updateEchoMood(newEcho); newEcho.personalityTraits = updateTraits(newEcho);

          const flowerGrowth = Math.min(100, state.flower.growth + (ef.flower || 0.45));
          const flowerStage = updateFlowerStage(flowerGrowth, state.flower.decay);

          const entity = state.entities[puzzle.entity];
          const newEntity = { ...entity, puzzlesSolved: entity.puzzlesSolved + 1, completed: (entity.puzzlesSolved + 1) >= entity.totalPuzzles };

          const newPuzzles = state.puzzles.map(p => {
            if (p.id === puzzleId) return { ...p, status: 'solved' as PuzzleStatus };
            if (p.dependencies.includes(puzzleId) && p.status === 'locked') return { ...p, status: 'active' as PuzzleStatus };
            return p;
          });

          const entityOrder: EntityId[] = ['echo', 'watcher', 'signal', 'architect'];
          const cIdx = entityOrder.indexOf(state.currentEntity);
          let nextEntity = state.currentEntity;
          const newTriggers = { ...state.narrativeTriggers };

          if (newEntity.completed && cIdx < 3) {
            nextEntity = entityOrder[cIdx + 1];
            newPuzzles.forEach(p => {
              if (p.entity === nextEntity && p.status === 'locked') {
                const depsMet = p.dependencies.every(d => newPuzzles.find(dp => dp.id === d)?.status === 'solved');
                if (depsMet || p.dependencies.length === 0) p.status = 'active';
              }
            });
            newTriggers[`entity_${puzzle.entity}_complete`] = true;
          }

          // Entity complete triggers
          if (puzzle.entity === 'echo' && newEntity.completed) newTriggers.entity_echo_complete = true;
          if (puzzle.entity === 'watcher' && newEntity.completed) newTriggers.entity_watcher_complete = true;
          if (puzzle.entity === 'signal' && newEntity.completed) newTriggers.entity_signal_complete = true;
          if (puzzle.entity === 'architect' && newEntity.completed) newTriggers.entity_architect_complete = true;

          // Update wishes progress
          const newWishes = state.wishes.map(w => ({
            ...w, progress: Math.min(100, w.progress + 0.5),
            status: (w.progress + 0.5 >= 100 ? 'completed' : 'active') as WishStatus,
          }));

          const event: TimelineEvent = {
            id: `ev_${Date.now()}`, time: `${state.time.hour}:${String(state.time.minute).padStart(2,'0')}`,
            phase: state.time.phase, description: puzzle.storyReveal, type: 'puzzle',
          };

          // Check achievements
          const newAchievements = checkAllAchievements(state.solvedPuzzles + 1, newEcho, flowerStage, state.wishes.length, state.time.dayCycle, state.endings);
          const mergedAchievements = mergeAchievements(state.achievements, newAchievements);

          // Check flower hidden layer
          let hiddenUnlocked = state.flower.hiddenUnlocked;
          if (flowerGrowth >= 100 && !hiddenUnlocked) {
            hiddenUnlocked = true;
            newTriggers.flower_complete = true;
          }

          set({
            echo: newEcho, puzzles: newPuzzles, solvedPuzzles: state.solvedPuzzles + 1,
            flower: { ...state.flower, growth: flowerGrowth, stage: flowerStage, hiddenUnlocked },
            entities: { ...state.entities, [puzzle.entity]: newEntity },
            currentEntity: nextEntity, wishes: newWishes,
            world: { stability: Math.max(0, 100 - newEcho.corruption - state.world.glitchLevel), corruptionLevel: Math.min(100, newEcho.corruption + state.world.glitchLevel), glitchLevel: state.world.glitchLevel, anomalyCount: state.world.anomalyCount },
            memory: { ...state.memory, fragmentsCollected: state.memory.fragmentsCollected + 1, timelineEvents: [...state.memory.timelineEvents.slice(-99), event], logsUnlocked: [...state.memory.logsUnlocked, puzzle.memoryUnlock].filter((l): l is string => l !== null) },
            player: { ...state.player, interactions: state.player.interactions + 1 },
            achievements: mergedAchievements, narrativeTriggers: newTriggers,
          });

          return { success: true, message: `✓ صحيح! ${puzzle.storyReveal}`, achievement: newAchievements.find(a => a.unlocked && !state.achievements.find(oa => oa.id === a.id)?.unlocked) };
        },

        // ⏰ TIME
        advanceTime: () => {
          const state = get();
          const now = new Date(); const h = now.getHours(); const m = now.getMinutes();
          let phase: TimePhase = 'morning'; let phaseIndex = 0; let isNight = false;

          if (h >= 5 && h < 12) { phase = 'morning'; phaseIndex = 0; isNight = false; }
          else if (h >= 12 && h < 17) { phase = 'day'; phaseIndex = 0; isNight = false; }
          else if (h >= 17 && h < 23) { phase = 'evening'; phaseIndex = 0; isNight = false; }
          else if (h === 23 && m < 5) { phase = '11:00'; phaseIndex = 1; isNight = true; }
          else if (h === 23 && m < 11) { phase = '11:05'; phaseIndex = 2; isNight = true; }
          else { phase = '11:11'; phaseIndex = 3; isNight = true; }
          if (h >= 0 && h < 5) { phase = '11:11'; phaseIndex = 3; isNight = true; }

          const newWorld = { ...state.world };
          const newEcho = { ...state.echo };
          if (isNight) {
            newWorld.glitchLevel = Math.min(100, newWorld.glitchLevel + (phaseIndex >= 3 ? 1 : 0.5));
            newEcho.corruption = Math.min(100, newEcho.corruption + (phaseIndex >= 3 ? 0.5 : 0.2));
            newEcho.fear = Math.min(100, newEcho.fear + (phaseIndex >= 3 ? 0.5 : 0.3));
            // Night anomaly events
            if (Math.random() > 0.8) newWorld.anomalyCount++;
          } else {
            newWorld.glitchLevel = Math.max(0, newWorld.glitchLevel - 0.3);
            newEcho.fear = Math.max(0, newEcho.fear - 0.2);
            newEcho.hope = Math.min(100, newEcho.hope + 0.2);
          }
          newWorld.stability = Math.max(0, 100 - newWorld.glitchLevel - newEcho.corruption);
          newWorld.corruptionLevel = Math.min(100, newEcho.corruption + newWorld.glitchLevel);

          const newTriggers = { ...state.narrativeTriggers };
          if (phaseIndex >= 1 && !state.narrativeTriggers.first_night) newTriggers.first_night = true;

          set({
            time: { ...state.time, hour: h, minute: m, phase: phase as TimePhase, phaseIndex, isNight, dayCycle: h < 5 && state.time.hour >= 23 ? state.time.dayCycle + 1 : state.time.dayCycle },
            world: newWorld, echo: { ...newEcho, mood: updateEchoMood(newEcho), personalityTraits: updateTraits(newEcho) },
            narrativeTriggers: newTriggers,
          });
        },

        // ⭐ WISHES
        addWish: (text: string) => {
          const state = get();
          const newWish: WishNode = { id: `w_${Date.now()}`, text, progress: 0, status: 'active', createdAt: new Date().toISOString().slice(0, 10), storyImpact: Math.floor(Math.random() * 30) + 10 };
          const newAchievements = checkAllAchievements(state.solvedPuzzles, state.echo, state.flower.stage, state.wishes.length + 1, state.time.dayCycle, state.endings);
          set({ wishes: [...state.wishes, newWish], achievements: mergeAchievements(state.achievements, newAchievements) });
        },

        completeWish: (wishId: string) => {
          const state = get();
          const newWishes = state.wishes.map(w => w.id === wishId ? { ...w, status: 'completed' as WishStatus, progress: 100 } : w);
          const completedCount = newWishes.filter(w => w.status === 'completed').length;
          set({ wishes: newWishes });
          // Check ending progress
          const ended = checkEndingProgress(state);
          set({ endings: ended });
        },

        // 🏁 ENDINGS
        checkEndings: () => {
          const state = get();
          const ended = checkEndingProgress(state);
          set({ endings: ended });
        },

        // ✅ FINAL CHOICE SYSTEM
        makeFinalChoice: (choice: string) => {
          const state = get();
          const newUnlockedEndings = [...state.unlockedEndings];
          const newSeenEndings = [...state.seenEndings];
          const newAchievedEnding = choice;

          // Determine which ending to unlock based on choice and conditions
          const ending = ExpandedEndingSystem.endings.find(e => e.id === choice);
          if (ending) {
            if (!newUnlockedEndings.includes(choice)) {
              newUnlockedEndings.push(choice);
            }
            if (!newSeenEndings.includes(choice)) {
              newSeenEndings.push(choice);
            }
          }

          set({
            finalChoice: choice,
            unlockedEndings: newUnlockedEndings,
            seenEndings: newSeenEndings,
            achievedEnding: newAchievedEnding,
            lastEndingViewed: choice
          });
        },

        // 🔄 RESET GAME
        resetGame: () => {
          if (window.confirm('هل أنت متأكد من أنك تريد إعادة تعيين التقدم؟ سيتم حذف جميع البيانات!')) {
            localStorage.removeItem('11-11-game-store');
            window.location.reload();
          }
        },

        // 🎬 REPLAY ENDING
        replayEnding: (endingId: string) => {
          const state = get();
          const newSeenEndings = [...state.seenEndings];
          if (!newSeenEndings.includes(endingId)) {
            newSeenEndings.push(endingId);
          }

          set({
            lastEndingViewed: endingId,
            seenEndings: newSeenEndings
          });
        },
      },
    }),
    {
      name: '11-11-game-store',
      partialize: (state) => ({
        echo: state.echo, solvedPuzzles: state.solvedPuzzles,
        flower: state.flower, memory: state.memory,
        player: state.player, achievements: state.achievements,
        endings: state.endings, wishes: state.wishes,
        narrativeTriggers: state.narrativeTriggers,
        world: state.world, time: state.time,
        entities: state.entities, currentEntity: state.currentEntity,
      }),
    }
  )
);

// ─── ACHIEVEMENT CHECKER ─────────────────────────────────────────────
function checkAllAchievements(solved: number, echo: EchoState, flowerStage: string, wishCount: number, dayCycle: number, endings: EndingState): Achievement[] {
  const list: Achievement[] = generateAllAchievements();
  const u = (id: string) => list.find(a => a.id === id)!;

  // Original achievements
  if (solved >= 1) u('first_puzzle').unlocked = true;
  if (solved >= 10) u('ten_puzzles').unlocked = true;
  if (solved >= 20) u('twenty_puzzles').unlocked = true;
  if (solved >= 50) u('fifty_puzzles').unlocked = true;
  if (solved >= 100) u('hundred_puzzles').unlocked = true;
  if (solved >= 219) u('all_puzzles').unlocked = true;
  if (echo.trust >= 25) u('trust_25').unlocked = true;
  if (echo.trust >= 50) u('trust_50').unlocked = true;
  if (echo.trust >= 75) u('trust_75').unlocked = true;
  if (echo.trust >= 100) u('trust_100').unlocked = true;
  if (['sprout','bloom','flourish','completed'].includes(flowerStage)) u('flower_seed').unlocked = true;
  if (['bloom','flourish','completed'].includes(flowerStage)) u('flower_sprout').unlocked = true;
  if (['flourish','completed'].includes(flowerStage)) u('flower_bloom').unlocked = true;
  if (flowerStage === 'completed') { u('flower_flourish').unlocked = true; u('flower_complete').unlocked = true; }
  if (wishCount >= 1) u('first_wish').unlocked = true;
  if (dayCycle >= 2) u('survive_night').unlocked = true;
  if (endings.sorrow.unlocked) u('ending_sorrow').unlocked = true;
  if (endings.truth.unlocked) u('ending_truth').unlocked = true;

  // Prelude Arc achievements (220-333)
  if (solved >= 220) u('first_change').unlocked = true;
  if (solved >= 230) u('echo_awakening').unlocked = true;
  if (solved >= 240) u('memory_distortion').unlocked = true;
  if (solved >= 260) u('interface_tension').unlocked = true;
  if (solved >= 270) u('entity_approach').unlocked = true;
  if (solved >= 280) u('truth_revelation').unlocked = true;
  if (solved >= 305) u('lina_message').unlocked = true;
  if (solved >= 320) u('hidden_plan').unlocked = true;
  if (solved >= 332) u('transformation_ready').unlocked = true;
  if (solved >= 333) u('echo_dominance').unlocked = true;
  if (solved >= 333) u('the_333rd_crack').unlocked = true;

  // Fracture Arc achievements (334-500)
  if (solved >= 334) u('first_crack').unlocked = true;
  if (solved >= 350) u('fracture_begin').unlocked = true;
  if (solved >= 390) u('system_distrust').unlocked = true;
  if (solved >= 400) u('hidden_truth').unlocked = true;
  if (solved >= 430) u('lina_message').unlocked = true;
  if (solved >= 450) u('catastrophic_event').unlocked = true;
  if (solved >= 470) u('true_identity').unlocked = true;
  if (solved >= 500) u('fracture_complete').unlocked = true;

  // Architect Arc achievements (501-666)
  if (solved >= 501) u('first_archive').unlocked = true;
  if (solved >= 520) u('architect_detected').unlocked = true;
  if (solved >= 540) u('kenja_record').unlocked = true;
  if (solved >= 560) u('lina_warning').unlocked = true;
  if (solved >= 580) u('protocol_breaker').unlocked = true;
  if (solved >= 600) u('echo_was_chosen').unlocked = true;
  if (solved >= 620) u('system_historian').unlocked = true;
  if (solved >= 640) u('hidden_experiment').unlocked = true;
  if (solved >= 666) u('architect_revelation').unlocked = true;
  if (solved >= 666) u('the_666th_door').unlocked = true;

  // Signal Arc achievements (667-888)
  if (solved >= 667) u('first_transmission').unlocked = true;
  if (solved >= 690) u('static_listener').unlocked = true;
  if (solved >= 715) u('signal_detected').unlocked = true;
  if (solved >= 740) u('echo_fear').unlocked = true;
  if (solved >= 765) u('architect_blocked').unlocked = true;
  if (solved >= 790) u('broken_frequency').unlocked = true;
  if (solved >= 815) u('third_presence').unlocked = true;
  if (solved >= 840) u('triple_conflict').unlocked = true;
  if (solved >= 865) u('signal_protection').unlocked = true;
  if (solved >= 888) u('the_888th_signal').unlocked = true;
  if (solved >= 888) u('signal_manifestation').unlocked = true;

  // Final Arc achievements (889-1000)
  if (solved >= 889) u('the_last_door').unlocked = true;
  if (solved >= 900) u('echo_remembers').unlocked = true;
  if (solved >= 915) u('lina_final_message').unlocked = true;
  if (solved >= 930) u('architect_collapse').unlocked = true;
  if (solved >= 945) u('signal_true_voice').unlocked = true;
  if (solved >= 960) u('original_wish').unlocked = true;
  if (solved >= 975) u('before_11_11').unlocked = true;
  if (solved >= 1000) u('the_1000th_puzzle').unlocked = true;
  if (solved >= 1000) u('the_last_wish').unlocked = true;

  // Memory collection achievements
  const preludeMemoryCount = Math.max(0, Math.min(solved - 219, 114)); // Prelude Arc puzzles solved (220-333)
  const fractureMemoryCount = Math.max(0, Math.min(solved - 333, 167)); // Fracture Arc puzzles solved (334-500)
  const architectMemoryCount = Math.max(0, Math.min(solved - 500, 167)); // Architect Arc puzzles solved (501-666)
  const signalMemoryCount = Math.max(0, Math.min(solved - 666, 222)); // Signal Arc puzzles solved (667-888)
  const finalMemoryCount = Math.max(0, solved - 888); // Final Arc puzzles solved (889-1000)

  if (preludeMemoryCount >= 10) u('flower_evolution').unlocked = true;
  if (preludeMemoryCount >= 25) u('system_tension').unlocked = true;
  if (preludeMemoryCount >= 50) u('echo_evolution').unlocked = true;
  if (preludeMemoryCount >= 114) u('prelude_master').unlocked = true;

  if (fractureMemoryCount >= 10) u('memory_hunter').unlocked = true;
  if (fractureMemoryCount >= 25) u('truth_seeker').unlocked = true;
  if (fractureMemoryCount >= 50) u('memory_collector').unlocked = true;
  if (fractureMemoryCount >= 167) u('memory_rebuilder').unlocked = true;

  if (architectMemoryCount >= 50) u('archive_master').unlocked = true;
  if (architectMemoryCount >= 1) u('architect_fragment').unlocked = true;
  if (echo.awareness >= 80) u('experiment_origin').unlocked = true;
  if (echo.corruption >= 70) u('architect_conflict').unlocked = true;
  if (solved >= 640) u('system_memory').unlocked = true;
  if (solved >= 660) u('before_lock').unlocked = true;

  // Special condition achievements
  if (echo.corruption >= 90) u('corruption_master').unlocked = true;
  if (echo.awareness >= 80) u('echo_evolution').unlocked = true;
  if (echo.corruption >= 90 && echo.awareness >= 80) u('system_breaker').unlocked = true;

  return list;
}

function mergeAchievements(current: Achievement[], newOnes: Achievement[]): Achievement[] {
  return newOnes.map(a => ({ ...a, unlocked: a.unlocked || current.find(c => c.id === a.id)?.unlocked || false, unlockedAt: a.unlocked && !current.find(c => c.id === a.id)?.unlocked ? Date.now() : current.find(c => c.id === a.id)?.unlockedAt || null }));
}

// ─── ENDING PROGRESS SYSTEM ──────────────────────────────────────────
function checkEndingProgress(state: GameState): EndingState {
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
  endings.truth.progress = Math.round((echo.trust > 70 ? 20 : 0) + (echo.memoryStability > 70 ? 20 : 0) + (solvedPuzzles >= 219 ? 30 : 0) + (echo.awareness > 70 ? 30 : 0));
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

export { ExpandedEndingSystem };
export default useGameStore;
