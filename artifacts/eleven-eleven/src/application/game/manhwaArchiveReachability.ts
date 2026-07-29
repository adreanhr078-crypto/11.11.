import {
  CHAPTER_01_MANHWA_PAGES,
  CHAPTER_01_MEMORY_SHARDS,
} from '../../content/puzzles/chapter01Campaign';
import {
  createManhwaPageAccessDefinition,
  createManhwaReachabilityReport,
} from '../../domain/manhwa/manhwaArchiveProgression';

export const CHAPTER_01_MANHWA_ACCESS_DEFINITIONS =
  CHAPTER_01_MANHWA_PAGES.map((page) => (
    createManhwaPageAccessDefinition({
      pageId: page.id,
      pageNumber: page.pageNumber,
      ...(page.prerequisitePageId
        ? { prerequisitePageId: page.prerequisitePageId }
        : {}),
    })
  ));

/**
 * The current Chapter 01 economy contains 20 earnable shard rewards. Buying
 * every paid page costs 134 shards, so the current ceiling is Page 06.
 */
export const CHAPTER_01_MANHWA_REACHABILITY =
  createManhwaReachabilityReport(
    CHAPTER_01_MANHWA_ACCESS_DEFINITIONS,
    CHAPTER_01_MEMORY_SHARDS.length,
  );
