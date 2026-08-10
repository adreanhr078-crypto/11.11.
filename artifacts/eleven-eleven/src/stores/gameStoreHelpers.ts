/**
 * gameStoreHelpers.ts — internal helpers for 11.11 gameStore
 * Updated v4.0: Now uses new puzzle generator and Echo transformation system
 */

import type {
  GameState, EchoState, PuzzleNode, ChapterId, FlowerStage,
  EchoMood, Achievement, EndingState, PuzzleStatus, ChapterState
} from '../core/gameTypes';
import type { StoryPhase } from '../core/puzzleTypes';
import {
  getPuzzleByNumber,
  getAllPuzzles,
} from '../core/puzzles/puzzleBank';
import {
  createInitialTransformationState,
  getEchoDialogueByStage,
} from '../core/echoTransformationSystem';
import { CHAPTER_DATASETS, CHAPTER_ORDER } from '../core/chapterSystem';
import { createInitialEchoPersonality } from '../domain/echo/echoPersonality';
import {
  createInitialProgression,
  getChapterForPuzzleNumber as findChapterForPuzzleNumber,
} from '../domain/progression/progression';
import { createInitialNarrativeState } from '../domain/narrative/narrativeState';
import { createInitialCinematicState } from '../domain/cinematics/cinematicState';
import {
  CHAPTER_DEFINITIONS,
  CONTENT_MANIFEST,
} from '../infrastructure/content/contentRegistry';
import {
  FINAL_MANHWA_PAGES,
} from '../content/manhwa/finalManhwa';
import {
  STORY_PUZZLE_COUNTS,
  STORY_PUZZLES,
} from '../content/puzzles/storyPuzzleCatalog';
import {
  createInitialAchievementProgressState,
  createInitialGameProgressionState,
} from '../core/gameProgressionDefaults';
import {
  createAchievementViews,
  synchronizeAchievementProgress,
} from '../domain/achievements/achievementProgression';
import {
  createInitialAwakeningWardState,
} from '../features/awakening-ward/domain/awakeningWardState';

const CONFIGURED_PUZZLE_COUNT = STORY_PUZZLE_COUNTS.total;
const CAMPAIGN_MEMORY_SHARD_SLOT_COUNT = STORY_PUZZLE_COUNTS.total;

// ─── INITIAL STATE ─────────────────────────────────────────────────────
export function buildInitialState(): GameState {
  const initialTransformation = createInitialTransformationState();
  const personality = createInitialEchoPersonality();
  const progression = createInitialProgression(
    CONTENT_MANIFEST.contentVersion,
    CHAPTER_DEFINITIONS,
  );
  const narrative = createInitialNarrativeState();
  const achievements = generateAllAchievements();
  // The final publication is readable end-to-end. Chapter prerequisite data
  // remains in the central manifest for a later product decision, but the
  // current game build must not strand the newly approved chapters.
  const initiallyUnlockedManhwaPageIds = FINAL_MANHWA_PAGES.map((page) => page.id);
  const progressionState = createInitialGameProgressionState({
    journey: progression,
    narrative,
    initiallyUnlockedManhwaPageIds,
    echo: {
      humanity: personality.humanity,
      trust: personality.trust,
      fear: personality.fear,
      anger: personality.anger,
      sadness: personality.sadness,
      corruption: personality.corruption,
      memoriesRecovered: personality.memoriesRecovered,
      memoryStability: 5,
      hope: 20,
      ragePoints: initialTransformation.ragePoints,
      loneliness: 80,
      awareness: 3,
      isolation: 0,
      forgivenessPoints: initialTransformation.forgivenessPoints,
    },
  });
  
  return {
    progressionState,
    currency: 0,
    collectedMemoryFragments: [],
    memoryFragmentCollectedAt: {},
    puzzleProgress: {},
    claimedPuzzleRewards: [],
    unlockedHintTiersByPuzzle: {},
    integratedMemoryFragmentIds: [],
    unlockedManhwaPageIds: [],
    viewedManhwaPageIds: [],
    manhwaPageUnlockedAt: {},
    manhwaPageViewedAt: {},
    consumedDialogueTriggerIds: [],
    lastAvailablePuzzleId: STORY_PUZZLES[0]!.id,
    lastPuzzleReward: null,
    echo: {
      personality,
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
    memory: { fragmentsCollected: 0, totalFragments: CAMPAIGN_MEMORY_SHARD_SLOT_COUNT, corruptedFragments: 0, timelineEvents: [], logsUnlocked: [] },
    allMemoryShards: [],
    puzzles: [], // Will be populated by chapter datasets
    totalPuzzles: CONFIGURED_PUZZLE_COUNT, solvedPuzzles: 0,
    progression,
    narrative,
    cinematic: createInitialCinematicState(),
    awakeningWard: createInitialAwakeningWardState(),
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
          totalPuzzles: (
            CHAPTER_DATASETS[id].puzzleRange[1]
            - CHAPTER_DATASETS[id].puzzleRange[0]
            + 1
          ),
          progress: 0,
        } as ChapterState,
      ])
    ) as Record<ChapterId, ChapterState>,
    currentChapter: 'chapter_1',
    entities: {
      echo: { unlocked: true, puzzlesSolved: 0, emotionalState: 0, storyFragments: [] },
      watcher: { unlocked: false, puzzlesSolved: 0, emotionalState: 0, storyFragments: [] },
      signal: { unlocked: false, puzzlesSolved: 0, emotionalState: 0, storyFragments: [] },
      architect: { unlocked: false, puzzlesSolved: 0, emotionalState: 0, storyFragments: [] },
    },
    wishes: [
      { id: 'w1', text: 'أتمنى أن أتذكر من أنا', progress: 0, status: 'active', createdAt: '2025-05-01', storyImpact: 25 },
      { id: 'w2', text: 'أتمنى أن أسامح نفسي', progress: 0, status: 'active', createdAt: '2025-05-01', storyImpact: 30 },
    ],
    player: { curiosity: 25, interactions: 0, choices: [] },
    world: { stability: 100, glitchLevel: 0, corruptionLevel: 0, anomalyCount: 0 },
    achievements,
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

// ─── ACHIEVEMENT COMPATIBILITY VIEWS ─────────────────────────────────
export function generateAllAchievements(): Achievement[] {
  return createAchievementViews(createInitialAchievementProgressState());
}

// ─── PUZZLE GENERATOR (MANUAL ONLY) ──────────────────────────────
export function generateAllPuzzles(): PuzzleNode[] {
  const authoredPuzzles = getAllPuzzles();
  return authoredPuzzles.map((manual, idx) => {
    const puzzleNumber = idx + 1;
    const previousPuzzleId = idx > 0 ? authoredPuzzles[idx - 1].id : null;
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
      phase: normalizeStoryPhase(manual.phase),
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
    throw new Error(
      `No authored puzzle found for #${puzzleNumber}. Add it through data/puzzles.`,
    );
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
    phase: normalizeStoryPhase(manual.phase),
    hints: manual.hints,
    puzzleType: manual.type,
  };

  return newNode;
}

function normalizeStoryPhase(value: string): StoryPhase | undefined {
  const phases: readonly StoryPhase[] = [
    'awakening',
    'discovery',
    'connection',
    'truth',
    'fracture',
    'vengeance',
    'finale',
  ];
  return phases.find((phase) => phase === value);
}

function getChapterForPuzzleNumber(puzzleNumber: number): ChapterId {
  const chapterId = findChapterForPuzzleNumber(
    puzzleNumber,
    CHAPTER_DEFINITIONS,
  );
  if (!chapterId) {
    throw new Error(`Puzzle ${puzzleNumber} is outside configured chapter ranges`);
  }
  return chapterId;
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
export function checkAllAchievements(
  solved: number,
  echo: EchoState,
  flowerStage: string,
  wishCount: number,
  dayCycle: number,
  endings: EndingState,
  memoryProgress?: { collected: number; total: number },
): Achievement[] {
  const progress = synchronizeAchievementProgress(
    createInitialAchievementProgressState(),
    {
      completedPuzzleCount: solved,
      echoTrust: echo.trust,
      echoLevel: echo.level,
      flowerStage,
      wishCount,
      dayCycle,
      endings: {
        sorrow: endings.sorrow.unlocked,
        truth: endings.truth.unlocked,
        dark: endings.dark.unlocked,
        mystery: endings.mystery.unlocked,
      },
      transformationStage: echo.transformationStage,
      memoryShards: memoryProgress,
    },
    null,
  );

  return createAchievementViews(progress);
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
