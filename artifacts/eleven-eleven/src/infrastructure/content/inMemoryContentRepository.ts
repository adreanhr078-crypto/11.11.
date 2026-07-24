import type {
  ContentPage,
  ContentPageRequest,
  ContentRepository,
} from '../../application/content/ContentRepository';
import type {
  ChapterId,
} from '../../domain/content/contracts';
import {
  CHAPTER_DEFINITIONS,
  DIALOGUE_DEFINITIONS,
  ENDING_DEFINITIONS,
  MEMORY_DEFINITIONS,
  PUZZLE_DEFINITIONS,
} from './contentRegistry';
import {
  CINEMATIC_ASSET_DEFINITIONS,
  CINEMATIC_EPISODE_DEFINITIONS,
} from './cinematicContentRegistry';

function page<T>(
  items: readonly T[],
  request: ContentPageRequest = {},
): ContentPage<T> {
  const offset = Math.max(0, Number(request.cursor ?? 0) || 0);
  const limit = Math.min(200, Math.max(1, request.limit ?? 50));
  const pageItems = items.slice(offset, offset + limit);
  const nextOffset = offset + pageItems.length;
  return {
    items: [...pageItems],
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
    total: items.length,
  };
}

export const inMemoryContentRepository: ContentRepository = {
  async getChapters() {
    return CHAPTER_DEFINITIONS;
  },

  async getPuzzles(chapterId, request) {
    return page(
      PUZZLE_DEFINITIONS.filter((item) => item.chapterId === chapterId),
      request,
    );
  },

  async getMemories(chapterId, request) {
    return page(
      MEMORY_DEFINITIONS.filter((item) => item.chapterId === chapterId),
      request,
    );
  },

  async getDialogues(chapterId, request) {
    return page(
      DIALOGUE_DEFINITIONS.filter((item) => item.chapterId === chapterId),
      request,
    );
  },

  async getEndings(request) {
    return page(ENDING_DEFINITIONS, request);
  },

  async getCinematicEpisodes(chapterId, request) {
    return page(
      CINEMATIC_EPISODE_DEFINITIONS.filter((item) => (
        item.chapterId === chapterId
      )),
      request,
    );
  },

  async getCinematicAssets(assetIds) {
    const requested = new Set(assetIds);
    return CINEMATIC_ASSET_DEFINITIONS.filter((asset) => (
      requested.has(asset.id)
    ));
  },
};

export async function getChapterContentSummary(chapterId: ChapterId) {
  const [puzzles, memories, dialogues, cinematics] = await Promise.all([
    inMemoryContentRepository.getPuzzles(chapterId, { limit: 1 }),
    inMemoryContentRepository.getMemories(chapterId, { limit: 1 }),
    inMemoryContentRepository.getDialogues(chapterId, { limit: 1 }),
    inMemoryContentRepository.getCinematicEpisodes(chapterId, { limit: 1 }),
  ]);
  return {
    chapterId,
    puzzles: puzzles.total,
    memories: memories.total,
    dialogues: dialogues.total,
    cinematics: cinematics.total,
  };
}
