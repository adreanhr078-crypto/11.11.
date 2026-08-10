import {
  FINAL_MANHWA_PAGES,
  type FinalManhwaPage,
} from '../../content/manhwa/finalManhwa';
import type {
  GameProgressionState,
} from '../../core/gameProgressionTypes';
import type {
  ManhwaMemoryPageDefinition,
} from '../../domain/puzzles/campaignContracts';
import {
  FINAL_MANHWA_ACCESS_DEFINITIONS,
} from '../game/manhwaArchiveReachability';

export type ManhwaArchivePageStatus =
  | 'unlocked'
  | 'available'
  | 'insufficient_shards'
  | 'previous_page_required';

export interface ManhwaArchiveUnlockedContent {
  title: ManhwaMemoryPageDefinition['title'];
  thumbnailSrc: string;
  accessibleDescription:
    ManhwaMemoryPageDefinition['accessibleDescription'];
  transcript: ManhwaMemoryPageDefinition['transcript'];
}

export interface ManhwaArchivePageReadModel {
  id: string;
  pageNumber: number;
  pageLabel: string;
  status: ManhwaArchivePageStatus;
  statusLabel: {
    ar: string;
    en: string;
  };
  reason: {
    ar: string;
    en: string;
  };
  shardCost: number;
  balanceAfterUnlock: number;
  isNew: boolean;
  unlockedContent?: ManhwaArchiveUnlockedContent;
}

export interface ManhwaArchiveReadModel {
  pages: ManhwaArchivePageReadModel[];
  spendableShardBalance: number;
  unlockedPageCount: number;
  totalPageCount: number;
  newPageCount: number;
}

export interface ManhwaViewerPageReadModel
  extends ManhwaArchivePageReadModel {
  unlockedContent: ManhwaArchiveUnlockedContent;
}

const statusLabels: Record<
  ManhwaArchivePageStatus,
  { ar: string; en: string }
> = {
  unlocked: {
    ar: 'مفتوحة',
    en: 'Unlocked',
  },
  available: {
    ar: 'متاحة للفتح',
    en: 'Available',
  },
  insufficient_shards: {
    ar: 'الرصيد غير كافٍ',
    en: 'Insufficient shards',
  },
  previous_page_required: {
    ar: 'الصفحة السابقة مطلوبة',
    en: 'Previous page required',
  },
};

function createReason(
  status: ManhwaArchivePageStatus,
  shardCost: number,
  balance: number,
  prerequisitePageNumber?: number,
): { ar: string; en: string } {
  if (status === 'unlocked') {
    return {
      ar: 'الصفحة متاحة للقراءة.',
      en: 'This page is ready to read.',
    };
  }
  if (status === 'available') {
    return {
      ar: `يمكن فتح الصفحة مقابل ${shardCost} شظايا.`,
      en: `Unlock for ${shardCost} Memory Shards.`,
    };
  }
  if (status === 'previous_page_required') {
    const page = prerequisitePageNumber ?? 1;
    return {
      ar: `افتح الصفحة ${String(page).padStart(2, '0')} أولًا.`,
      en: `Unlock Page ${String(page).padStart(2, '0')} first.`,
    };
  }
  const missing = Math.max(0, shardCost - balance);
  return {
    ar: `تحتاج إلى ${missing} شظايا إضافية.`,
    en: `${missing} more Memory Shards required.`,
  };
}

function getStatus(
  progressionState: GameProgressionState,
  page: FinalManhwaPage,
  shardCost: number,
  prerequisitePageId?: string,
): ManhwaArchivePageStatus {
  const unlockedPageIds = progressionState.manhwa.unlockedPageIds;
  if (
    unlockedPageIds.includes(page.id)
    || page.pageKind === 'cover'
    || page.pageKind === 'credits'
    || page.pageKind === 'teaser'
    || page.pageKind === 'back-cover'
  ) return 'unlocked';
  if (
    prerequisitePageId
    && !unlockedPageIds.includes(prerequisitePageId)
  ) {
    return 'previous_page_required';
  }
  return progressionState.resources.memoryShards.spendableBalance
      >= shardCost
    ? 'available'
    : 'insufficient_shards';
}

/**
 * Builds the complete Archive presentation exclusively from canonical
 * progression state plus immutable page definitions. Locked pages never
 * receive their image URL in the returned model.
 */
export function createManhwaArchiveReadModel(
  progressionState: GameProgressionState,
): ManhwaArchiveReadModel {
  const balance =
    progressionState.resources.memoryShards.spendableBalance;
  const unlockedPageIds = progressionState.manhwa.unlockedPageIds;
  const viewedPageIds = new Set(progressionState.manhwa.viewedPageIds);
  const accessByPageId = new Map(
    FINAL_MANHWA_ACCESS_DEFINITIONS.map((page) => [
      page.pageId,
      page,
    ]),
  );
  const pages = [...FINAL_MANHWA_PAGES]
    .sort((left, right) => left.globalPageNumber - right.globalPageNumber)
    .map((page): ManhwaArchivePageReadModel => {
      const access = accessByPageId.get(page.id);
      const shardCost = access?.shardCost ?? 0;
      const prerequisitePageId = access?.prerequisitePageId;
      const prerequisitePageNumber = prerequisitePageId
        ? FINAL_MANHWA_PAGES.find(
            (candidate) => candidate.id === prerequisitePageId,
          )?.globalPageNumber
        : undefined;
      const status = getStatus(
        progressionState,
        page,
        shardCost,
        prerequisitePageId,
      );
      const unlocked = status === 'unlocked';

      return {
        id: page.id,
        pageNumber: page.globalPageNumber,
        pageLabel: String(page.globalPageNumber).padStart(2, '0'),
        status,
        statusLabel: statusLabels[status],
        reason: createReason(
          status,
          shardCost,
          balance,
          prerequisitePageNumber,
        ),
        shardCost,
        balanceAfterUnlock: Math.max(0, balance - shardCost),
        // Book-matter pages are always readable, but only pages explicitly
        // present in canonical progression should create a new-content badge.
        isNew: unlocked
          && unlockedPageIds.includes(page.id)
          && !viewedPageIds.has(page.id),
        ...(unlocked
          ? {
              unlockedContent: {
                title: page.title,
                thumbnailSrc: page.imageSrc,
                accessibleDescription: page.accessibleDescription,
                transcript: page.transcript,
              },
            }
          : {}),
      };
    });
  const unlockedPageCount = pages.filter(
    (page) => page.status === 'unlocked',
  ).length;

  return {
    pages,
    spendableShardBalance: balance,
    unlockedPageCount,
    totalPageCount: pages.length,
    newPageCount: pages.filter((page) => page.isNew).length,
  };
}

export function getCanonicalManhwaBadgeCount(
  progressionState: GameProgressionState,
): number {
  const viewedPageIds = new Set(progressionState.manhwa.viewedPageIds);
  return new Set(progressionState.manhwa.unlockedPageIds)
    .size - new Set(progressionState.manhwa.unlockedPageIds.filter(
      (pageId) => viewedPageIds.has(pageId),
    )).size;
}

export function getUnlockedManhwaViewerPages(
  model: ManhwaArchiveReadModel,
): ManhwaViewerPageReadModel[] {
  return model.pages.filter(
    (page): page is ManhwaViewerPageReadModel => (
      page.status === 'unlocked'
      && page.unlockedContent !== undefined
    ),
  );
}
