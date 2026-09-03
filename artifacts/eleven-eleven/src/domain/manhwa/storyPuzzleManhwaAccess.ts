import {
  FINAL_MANHWA_PAGE_COUNT,
  FINAL_MANHWA_RELEASED_PAGE_COUNT,
  FINAL_MANHWA_PAGES,
} from '../../content/manhwa/finalManhwa';
import {
  STORY_PUZZLE_BY_ID,
  STORY_PUZZLES,
} from '../../content/puzzles/storyPuzzleCatalog';

const MAIN_STORY_PUZZLES = STORY_PUZZLES
  .filter((puzzle) => puzzle.classification === 'main')
  .sort((left, right) => left.order - right.order);

export interface StoryPuzzleManhwaAccess {
  accessiblePageIds: readonly string[];
  maxAccessibleGlobalPage: number;
  completedMainPuzzleCount: number;
  totalMainPuzzleCount: number;
  nextGatePuzzleId: string | null;
  nextGateSourcePage: number | null;
  allMainPuzzlesCompleted: boolean;
}

/**
 * The reader and Story Puzzle campaign form one progression loop:
 * read through the next main puzzle's source page, solve it, then reveal the
 * next reading window. Secret puzzles never block the main publication.
 */
export function deriveStoryPuzzleManhwaAccess(
  completedPuzzleIds: readonly string[],
): StoryPuzzleManhwaAccess {
  const completed = new Set(
    completedPuzzleIds.filter((puzzleId) => (
      STORY_PUZZLE_BY_ID[puzzleId]?.classification === 'main'
    )),
  );
  const nextGate = MAIN_STORY_PUZZLES.find((puzzle) => !completed.has(puzzle.id));
  const allMainPuzzlesCompleted = nextGate === undefined;
  const requestedMaxAccessibleGlobalPage = allMainPuzzlesCompleted
    ? FINAL_MANHWA_PAGE_COUNT
    : nextGate.source.globalPageNumber;
  // The corrected PDF is stored as one immutable publication, while the
  // player build exposes only the approved opening slice. A solved opening
  // puzzle must never turn unpublished chapters into a hidden bypass.
  const maxAccessibleGlobalPage = Math.min(
    requestedMaxAccessibleGlobalPage,
    FINAL_MANHWA_RELEASED_PAGE_COUNT,
  );
  const accessiblePageIds = FINAL_MANHWA_PAGES
    .filter((page) => (
      page.published && page.globalPageNumber <= maxAccessibleGlobalPage
    ))
    .map((page) => page.id);

  return {
    accessiblePageIds,
    maxAccessibleGlobalPage,
    completedMainPuzzleCount: completed.size,
    totalMainPuzzleCount: MAIN_STORY_PUZZLES.length,
    nextGatePuzzleId: nextGate?.id ?? null,
    nextGateSourcePage: nextGate?.source.globalPageNumber ?? null,
    allMainPuzzlesCompleted,
  };
}

export const INITIAL_STORY_PUZZLE_MANHWA_ACCESS = Object.freeze(
  deriveStoryPuzzleManhwaAccess([]),
);
