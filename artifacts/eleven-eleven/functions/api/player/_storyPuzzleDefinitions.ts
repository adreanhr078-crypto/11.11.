import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLES,
} from '../../../src/content/puzzles/storyPuzzleCatalog';
import type {
  StoryPuzzleDifficulty,
  StoryPuzzleDraft,
} from '../../../src/domain/story-puzzles/storyPuzzleContracts';

interface PuzzleSolution {
  tokens?: readonly string[];
  unorderedTokens?: boolean;
  assignments?: Readonly<Record<string, string>>;
  imageOrder?: readonly string[];
  rotations?: Readonly<Record<string, number>>;
  stages?: readonly PuzzleSolution[];
}

interface PuzzleBalance {
  xp: number;
  coins: number;
  perfectBonusCoins: number;
}

export interface ServerStoryPuzzleDefinition {
  id: string;
  shardId: string;
  solution: PuzzleSolution;
  balance: PuzzleBalance;
}

/** Central, server-owned balance. The browser never chooses an amount. */
export const STORY_PUZZLE_BALANCE: Readonly<Record<
  StoryPuzzleDifficulty,
  PuzzleBalance
>> = Object.freeze({
  intro: { xp: 75, coins: 18, perfectBonusCoins: 6 },
  standard: { xp: 100, coins: 24, perfectBonusCoins: 8 },
  advanced: { xp: 125, coins: 30, perfectBonusCoins: 10 },
  final: { xp: 175, coins: 40, perfectBonusCoins: 15 },
});

/**
 * Story hints are an intentional, server-priced choice.  They never block
 * the main path or erase a draft, but each deeper level costs verified Signal
 * Coins so asking Echo for more certainty remains meaningful.
 */
export const STORY_PUZZLE_HINT_COSTS = Object.freeze([4, 8, 14] as const);

const rawSolutions: Readonly<Record<string, PuzzleSolution>> = Object.freeze({
  story_puzzle_01_echo_network_signal_sync: {
    tokens: ['58', 'channel-11'],
  },
  story_puzzle_02_echo_network_archive_route: {
    tokens: ['signal', 'access', 'memory', 'echo'],
  },
});

export const SERVER_STORY_PUZZLE_BY_ID: Readonly<Record<string, ServerStoryPuzzleDefinition>> = Object.freeze(
  Object.fromEntries(STORY_PUZZLES.map((puzzle) => {
    const solution = rawSolutions[puzzle.id];
    if (!solution) throw new Error(`Missing server solution for ${puzzle.id}.`);
    return [puzzle.id, {
      id: puzzle.id,
      shardId: `story_puzzle_shard_${String(puzzle.order).padStart(2, '0')}`,
      solution,
      balance: STORY_PUZZLE_BALANCE[puzzle.difficulty],
    } satisfies ServerStoryPuzzleDefinition];
  })),
);

function arraysEqual(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function recordsEqual(
  left: Readonly<Record<string, string | number>> | undefined,
  right: Readonly<Record<string, string | number>> | undefined,
): boolean {
  const leftEntries = Object.entries(left ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return leftEntries.length === rightEntries.length
    && leftEntries.every(([key, value], index) => (
      key === rightEntries[index]?.[0] && value === rightEntries[index]?.[1]
    ));
}

function matchesSolution(solution: PuzzleSolution, draft: StoryPuzzleDraft): boolean {
  if (solution.stages) {
    const submittedStages = draft.assignments.__stages;
    if (typeof submittedStages !== 'string') return false;
    try {
      const stages = JSON.parse(submittedStages) as StoryPuzzleDraft[];
      return Array.isArray(stages)
        && stages.length === solution.stages.length
        && solution.stages.every((stage, index) => matchesSolution(stage, stages[index]!));
    } catch {
      return false;
    }
  }
  const tokensMatch = !solution.tokens || (solution.unorderedTokens
    ? arraysEqual([...solution.tokens].sort(), [...draft.tokens].sort())
    : arraysEqual(solution.tokens, draft.tokens));
  return tokensMatch
    && (!solution.assignments || recordsEqual(solution.assignments, draft.assignments))
    && (!solution.imageOrder || arraysEqual(solution.imageOrder, draft.imageOrder))
    && (!solution.rotations || recordsEqual(solution.rotations, draft.rotations));
}

/** Used only on the server after the caller has passed its unlock checks. */
export function isServerStoryPuzzleSubmissionCorrect(
  puzzleId: string,
  draft: StoryPuzzleDraft,
): boolean {
  const definition = SERVER_STORY_PUZZLE_BY_ID[puzzleId];
  return Boolean(definition && matchesSolution(definition.solution, draft));
}

/** Compile-time guard against public/server catalog drift. */
for (const puzzle of STORY_PUZZLES) {
  if (!STORY_PUZZLE_BY_ID[puzzle.id] || !SERVER_STORY_PUZZLE_BY_ID[puzzle.id]) {
    throw new Error(`Story puzzle catalog drift: ${puzzle.id}`);
  }
}
