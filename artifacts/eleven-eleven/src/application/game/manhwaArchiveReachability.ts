import {
  STORY_PUZZLE_COUNTS,
} from '../../content/puzzles/storyPuzzleCatalog';
import { FINAL_MANHWA_PAGES } from '../../content/manhwa/finalManhwa';
import {
  createManhwaPageAccessDefinition,
  createManhwaReachabilityReport,
} from '../../domain/manhwa/manhwaArchiveProgression';

export const FINAL_MANHWA_ACCESS_DEFINITIONS =
  FINAL_MANHWA_PAGES.filter((page) => page.published).map((page) => (
    createManhwaPageAccessDefinition({
      pageId: page.id,
      pageNumber: page.globalPageNumber,
      ...(page.prerequisitePageId
        ? { prerequisitePageId: page.prerequisitePageId }
        : {}),
    })
  ));

/**
 * Static QA reachability remains based on the active Story Puzzle campaign's
 * finite fragment pool. It never grants or unlocks content at runtime.
 */
export const FINAL_MANHWA_REACHABILITY =
  createManhwaReachabilityReport(
    FINAL_MANHWA_ACCESS_DEFINITIONS,
    STORY_PUZZLE_COUNTS.total,
  );
