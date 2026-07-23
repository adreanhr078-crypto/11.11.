import type {
  ChapterId,
  ChapterState,
  GameActions,
  GameState,
  PuzzleNode,
  PuzzleStatus,
  TimelineEvent,
  WishStatus,
} from '../../core/gameTypes';
import { isAnswerCorrect } from '../../core/puzzles/puzzleLoader';
import {
  calculateTransformationEffects,
} from '../../core/echoTransformationSystem';
import type { PuzzleId } from '../../domain/content/contracts';
import {
  deriveChapterProgress,
  recordPuzzleOutcome,
  type ProgressionState,
} from '../../domain/progression/progression';
import {
  CHAPTER_DEFINITIONS,
} from '../../infrastructure/content/contentRegistry';
import {
  checkAllAchievements,
  mergeAchievements,
  updateEchoMood,
  updateFlowerStage,
  updateTraits,
} from '../../stores/gameStoreHelpers';
import {
  applyLegacyEchoEffects,
} from './echoCompatibility';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type PuzzleActions = Pick<
  GameActions,
  'solve' | 'buyHint' | 'skipPuzzle' | 'rerollPuzzle'
>;

function toPuzzleId(id: string): PuzzleId | null {
  return /^puzzle_\d+$/.test(id) ? id as PuzzleId : null;
}

function deriveLegacyChapters(
  current: GameState['chapters'],
  progression: ProgressionState,
): Record<ChapterId, ChapterState> {
  return Object.fromEntries(CHAPTER_DEFINITIONS.map((definition) => {
    const totalPuzzles = (
      definition.puzzleRange[1] - definition.puzzleRange[0] + 1
    );
    const progress = deriveChapterProgress(
      progression,
      definition.id,
      totalPuzzles,
      CHAPTER_DEFINITIONS,
    );
    const existing = current[definition.id];
    return [
      definition.id,
      {
        id: definition.id,
        title: existing?.title ?? definition.title.ar,
        description: existing?.description ?? definition.description.ar,
        glyph: existing?.glyph ?? definition.glyph,
        color: existing?.color ?? definition.color,
        unlocked: progress.unlocked,
        completed: progress.completed,
        puzzlesSolved: progress.resolvedPuzzles,
        totalPuzzles: progress.totalPuzzles,
        progress: progress.progress,
      },
    ];
  })) as Record<ChapterId, ChapterState>;
}

function unlockDependants(
  puzzles: PuzzleNode[],
  resolvedPuzzleId: string,
): PuzzleNode[] {
  return puzzles.map((puzzle) => {
    if (
      puzzle.status === 'locked'
      && puzzle.dependencies.includes(resolvedPuzzleId)
    ) {
      const dependenciesResolved = puzzle.dependencies.every((dependencyId) => {
        const dependency = puzzles.find(({ id }) => id === dependencyId);
        return dependency?.status === 'solved' || dependency?.status === 'skipped';
      });
      if (dependenciesResolved) {
        return { ...puzzle, status: 'active' as PuzzleStatus };
      }
    }
    return puzzle;
  });
}

function transitionProgression(
  state: GameState,
  puzzle: PuzzleNode,
  outcome: 'solved' | 'skipped',
): {
  progression: ProgressionState;
  chapters: Record<ChapterId, ChapterState>;
} | null {
  const puzzleId = toPuzzleId(puzzle.id);
  if (!puzzleId) return null;
  const progression = recordPuzzleOutcome(
    state.progression,
    puzzleId,
    puzzle.chapterId,
    outcome,
    CHAPTER_DEFINITIONS,
  );
  return {
    progression,
    chapters: deriveLegacyChapters(state.chapters, progression),
  };
}

function applyPuzzleEffects(
  state: GameState,
  puzzle: PuzzleNode,
): GameState['echo'] {
  const effects = puzzle.effects;
  let echo = applyLegacyEchoEffects(state.echo, {
    trust: effects.trust,
    fear: effects.fear,
    memoryStability: effects.memoryStability,
    corruption: effects.corruption,
    hope: effects.hope,
  });
  echo = {
    ...echo,
    loneliness: Math.min(
      100,
      Math.max(0, echo.loneliness + (effects.loneliness ?? 0)),
    ),
    awareness: Math.min(
      100,
      Math.max(0, echo.awareness + (effects.awareness ?? 0)),
    ),
  };

  const transformation = calculateTransformationEffects(
    effects.rageEffect ?? 0,
    effects.forgivenessEffect ?? 0,
    puzzle.act ?? 1,
    echo.transformationStage,
  );
  echo = applyLegacyEchoEffects(echo, {
    ragePoints: transformation.rageDelta,
    corruption: transformation.corruptionDelta,
  });
  echo = {
    ...echo,
    forgivenessPoints: Math.min(
      100,
      Math.max(0, echo.forgivenessPoints + transformation.forgivenessDelta),
    ),
  };

  if (echo.ragePoints >= 80) echo.transformationStage = 'vengeful';
  else if (
    echo.forgivenessPoints >= 60
    && echo.forgivenessPoints > echo.ragePoints
  ) echo.transformationStage = 'redeemed';
  else if (echo.ragePoints >= 60) echo.transformationStage = 'fractured';
  if (echo.awareness >= 80) echo.transformationStage = 'ascended';

  const xpGain = Math.max(
    1,
    Math.floor(25 * (1 + puzzle.difficulty / 10))
      * (echo.xpMultiplier ?? 1),
  );
  echo.xp += xpGain;
  if (echo.xp >= echo.xpMax) {
    echo.level += 1;
    echo.xp -= echo.xpMax;
    echo.xpMax = Math.floor(echo.xpMax * 1.2);
    echo.xpMultiplier = (echo.xpMultiplier ?? 1) + 0.05;
    echo.coins += 100 * echo.level;
  }
  echo.coins += puzzle.coins ?? Math.floor(5 * (1 + puzzle.difficulty / 3));
  echo.mood = updateEchoMood(echo);
  echo.personalityTraits = updateTraits(echo);
  return echo;
}

export function createPuzzleActions(
  set: GameStateSetter,
  get: GameStateGetter,
): PuzzleActions {
  return {
    solve: (puzzleId, answer) => {
      const state = get();
      const puzzle = state.puzzles.find(({ id }) => id === puzzleId);
      if (!puzzle) {
        return { success: false, message: 'اللغز غير موجود' };
      }
      if (puzzle.status !== 'active') {
        return { success: false, message: 'اللغز غير متاح للحل' };
      }
      if (!isAnswerCorrect(puzzle, answer)) {
        return { success: false, message: 'إجابة غير صحيحة، حاول مرة أخرى' };
      }

      const transition = transitionProgression(state, puzzle, 'solved');
      if (!transition) {
        return { success: false, message: 'معرّف اللغز غير صالح' };
      }
      const echo = applyPuzzleEffects(state, puzzle);
      let puzzles = state.puzzles.map((item) => (
        item.id === puzzleId
          ? { ...item, status: 'solved' as PuzzleStatus }
          : item
      ));
      puzzles = unlockDependants(puzzles, puzzleId);

      const flowerGrowth = Math.min(
        100,
        state.flower.growth + (puzzle.effects.flower ?? 0.45),
      );
      const flowerStage = updateFlowerStage(
        flowerGrowth,
        state.flower.decay,
      );
      const memoryWasNew = Boolean(
        puzzle.memoryUnlock
        && !state.memory.logsUnlocked.includes(puzzle.memoryUnlock),
      );
      const timelineEvent: TimelineEvent = {
        id: `ev_${Date.now()}`,
        time: `${state.time.hour}:${String(state.time.minute).padStart(2, '0')}`,
        phase: state.time.phase,
        description: puzzle.storyReveal,
        type: 'puzzle',
      };
      const wishes = state.wishes.map((wish) => ({
        ...wish,
        progress: Math.min(100, wish.progress + 0.5),
        status: (
          wish.progress + 0.5 >= 100 ? 'completed' : 'active'
        ) as WishStatus,
      }));
      const solvedPuzzles = transition.progression.completedPuzzleIds.length;
      const achievements = checkAllAchievements(
        solvedPuzzles,
        echo,
        flowerStage,
        wishes.length,
        state.time.dayCycle,
        state.endings,
      );
      const newlyCompletedChapters = transition.progression.completedChapterIds
        .filter((id) => !state.progression.completedChapterIds.includes(id));
      const narrativeTriggers = { ...state.narrativeTriggers };
      for (const chapterId of newlyCompletedChapters) {
        narrativeTriggers[`${chapterId}_complete`] = true;
      }

      set({
        echo,
        puzzles,
        progression: transition.progression,
        solvedPuzzles,
        chapters: transition.chapters,
        currentChapter: transition.progression.currentChapterId,
        flower: {
          ...state.flower,
          growth: flowerGrowth,
          stage: flowerStage,
          hiddenUnlocked: state.flower.hiddenUnlocked || flowerGrowth >= 100,
        },
        wishes,
        memory: {
          ...state.memory,
          fragmentsCollected: state.memory.fragmentsCollected
            + (memoryWasNew ? 1 : 0),
          timelineEvents: [
            ...state.memory.timelineEvents.slice(-99),
            timelineEvent,
          ],
          logsUnlocked: puzzle.memoryUnlock && memoryWasNew
            ? [...state.memory.logsUnlocked, puzzle.memoryUnlock]
            : state.memory.logsUnlocked,
        },
        world: {
          ...state.world,
          stability: Math.max(
            0,
            100 - echo.corruption - state.world.glitchLevel,
          ),
          corruptionLevel: Math.min(
            100,
            echo.corruption + state.world.glitchLevel,
          ),
        },
        player: {
          ...state.player,
          interactions: state.player.interactions + 1,
        },
        achievements: mergeAchievements(state.achievements, achievements),
        narrativeTriggers,
      });

      return {
        success: true,
        message: `صحيح! ${puzzle.storyReveal}`,
        achievement: achievements.find((achievement) => (
          achievement.unlocked
          && !state.achievements.find(({ id }) => id === achievement.id)?.unlocked
        )),
      };
    },

    buyHint: (puzzleId) => {
      const state = get();
      const puzzle = state.puzzles.find(({ id }) => id === puzzleId);
      if (!puzzle) {
        return { success: false, message: 'اللغز غير موجود' };
      }
      if (puzzle.status !== 'active') {
        return { success: false, message: 'اللغز غير متاح' };
      }
      const price = state.shopPrices.hintPrice;
      if (state.echo.coins < price) {
        return { success: false, message: `تحتاج ${price} عملة` };
      }
      const hint = puzzle.hints?.[2] ?? puzzle.hint;
      set({
        echo: {
          ...state.echo,
          coins: state.echo.coins - price,
          usedHints: [...new Set([...state.echo.usedHints, puzzleId])],
        },
      });
      return { success: true, message: `تلميح: ${hint}`, hint };
    },

    skipPuzzle: (puzzleId) => {
      const state = get();
      const puzzle = state.puzzles.find(({ id }) => id === puzzleId);
      if (!puzzle) {
        return { success: false, message: 'اللغز غير موجود' };
      }
      if (puzzle.status !== 'active') {
        return { success: false, message: 'اللغز غير متاح للتخطي' };
      }
      const price = state.shopPrices.skipPrice;
      if (state.echo.coins < price) {
        return { success: false, message: `تحتاج ${price} عملة` };
      }
      const transition = transitionProgression(state, puzzle, 'skipped');
      if (!transition) {
        return { success: false, message: 'معرّف اللغز غير صالح' };
      }
      let puzzles = state.puzzles.map((item) => (
        item.id === puzzleId
          ? { ...item, status: 'skipped' as PuzzleStatus }
          : item
      ));
      puzzles = unlockDependants(puzzles, puzzleId);
      set({
        puzzles,
        progression: transition.progression,
        chapters: transition.chapters,
        currentChapter: transition.progression.currentChapterId,
        echo: {
          ...state.echo,
          coins: state.echo.coins - price,
          skippedPuzzles: [
            ...new Set([...state.echo.skippedPuzzles, puzzleId]),
          ],
        },
      });
      return { success: true, message: 'تم تخطي اللغز' };
    },

    rerollPuzzle: (puzzleId) => {
      const state = get();
      const puzzle = state.puzzles.find(({ id }) => id === puzzleId);
      if (!puzzle || puzzle.status !== 'active') {
        return { success: false, message: 'اللغز غير متاح للتبديل' };
      }
      const price = state.shopPrices.rerollPrice;
      if (state.echo.coins < price) {
        return { success: false, message: `تحتاج ${price} عملة` };
      }
      const replacement = state.puzzles.find((candidate) => (
        candidate.id !== puzzleId
        && candidate.chapterId === puzzle.chapterId
        && candidate.status === 'locked'
        && candidate.difficulty <= Math.max(1, puzzle.difficulty - 1)
      ));
      if (!replacement) {
        return { success: false, message: 'لا يوجد لغز بديل متاح' };
      }
      set({
        puzzles: state.puzzles.map((item) => {
          if (item.id === puzzleId) {
            return { ...item, status: 'failed' as PuzzleStatus };
          }
          if (item.id === replacement.id) {
            return { ...item, status: 'active' as PuzzleStatus };
          }
          return item;
        }),
        echo: {
          ...state.echo,
          coins: state.echo.coins - price,
          rerolledPuzzles: [
            ...new Set([...state.echo.rerolledPuzzles, puzzleId]),
          ],
        },
      });
      return {
        success: true,
        message: `تم التبديل إلى ${replacement.id}`,
        newPuzzleId: replacement.id,
      };
    },
  };
}
