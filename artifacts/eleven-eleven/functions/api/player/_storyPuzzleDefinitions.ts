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

export const STORY_PUZZLE_HINT_COSTS = Object.freeze([0, 12, 24] as const);

const imagePieces = (count: number): readonly string[] => (
  Array.from({ length: count }, (_, index) => `piece-${index}`)
);

const zeroRotations = (count: number): Readonly<Record<string, number>> => (
  Object.freeze(Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`piece-${index}`, 0]),
  ))
);

const rawSolutions: Readonly<Record<string, PuzzleSolution>> = Object.freeze({
  story_puzzle_01_signal_calibration: { tokens: ['58', 'channel-11'] },
  story_puzzle_02_system_sequence: {
    tokens: ['signal', 'access', 'memory', 'echo'],
  },
  story_puzzle_03_torn_memory: {
    imageOrder: imagePieces(9), rotations: zeroRotations(9),
  },
  story_puzzle_04_circuit_restore: {
    assignments: {
      power: 'terminal-wave', data: 'terminal-access', memory: 'terminal-memory',
    },
  },
  story_puzzle_05_color_protocol: {
    assignments: {
      triangle: 'triangle', square: 'square', circle: 'circle',
    },
  },
  story_puzzle_06_cipher_decoder: { tokens: ['three', 'one', 'one'] },
  story_puzzle_07_evidence_protocol: { tokens: ['cam07'] },
  story_puzzle_08_pattern_breach: { tokens: ['d3'] },
  story_puzzle_09_timeline_recovery: {
    tokens: ['1200', '1201', '1203', '1204'],
  },
  story_puzzle_10_memory_grid: { tokens: ['a1', 'b2', 'c3', 'b2'] },
  story_puzzle_11_data_route_zero: { tokens: ['a', 'c', 'd', 'f'] },
  story_puzzle_12_mirror_code: { tokens: ['four', 'one', 'four'] },
  story_puzzle_13_visual_forensics: { tokens: ['x2', 'z1'] },
  story_puzzle_14_system_matrix: {
    rotations: { tile1: 1, tile2: 2, tile3: 0, tile4: 3 },
  },
  story_puzzle_15_system_breach: {
    stages: [
      { tokens: ['74', 'channel-11'] },
      { tokens: ['memory'] },
      { assignments: { access: 'echo' } },
    ],
  },
  story_puzzle_16_memory_reconstruction: {
    rotations: { layer1: 1, layer2: 0, layer3: 3, layer4: 2 },
  },
  story_puzzle_17_contradictory_records: { tokens: ['r03'] },
  story_puzzle_18_emergency_reroute: {
    assignments: { power: '40', data: '30', cooling: '30' },
  },
  story_puzzle_19_final_deduction: { tokens: ['1111', 'cam07', 'r01'] },
  story_puzzle_20_core_sequence: {
    stages: [
      { tokens: ['81', 'channel-11'] },
      { tokens: ['signal', 'memory', 'echo'] },
      { tokens: ['access', 'memory', 'signal'] },
      { tokens: ['signal', 'access', 'memory', 'echo'] },
    ],
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
  return (!solution.tokens || arraysEqual(solution.tokens, draft.tokens))
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
