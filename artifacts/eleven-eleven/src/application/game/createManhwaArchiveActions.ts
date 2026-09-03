import {
  FINAL_MANHWA_PAGE_BY_ID,
} from '../../content/manhwa/finalManhwa';
import type {
  GameActions,
} from '../../core/gameTypes';
import type {
  ManhwaUnlockTransactionResult,
} from '../../core/manhwaArchiveTypes';
import {
  deriveStoryPuzzleManhwaAccess,
} from '../../domain/manhwa/storyPuzzleManhwaAccess';
import {
  createManhwaUnlockReceiptKey,
} from '../../core/manhwaArchiveTypes';
import {
  projectGameProgressionCompatibility,
} from './createGameProgressionActions';
import type {
  GameStateGetter,
  GameStateSetter,
  GameTimestampProvider,
} from './statePorts';

type ManhwaArchiveActions = Pick<
  GameActions,
  'unlockManhwaPage' | 'synchronizeStoryPuzzleManhwaAccess'
>;

export function createManhwaArchiveActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: GameTimestampProvider = () => new Date().toISOString(),
): ManhwaArchiveActions {
  return {
    synchronizeStoryPuzzleManhwaAccess(completedPuzzleIds, timestamp = now()) {
      const access = deriveStoryPuzzleManhwaAccess(completedPuzzleIds);
      const targetPageIds = [...access.accessiblePageIds];
      const targetPageIdSet = new Set(targetPageIds);
      let changed = false;
      set((state) => {
        const current = state.progressionState.manhwa;
        const currentPageIds = current.unlockedPageIds;
        changed = currentPageIds.length !== targetPageIds.length
          || targetPageIds.some((pageId, index) => pageId !== currentPageIds[index]);
        if (!changed) return {};

        const pageUnlockedAt = Object.fromEntries(targetPageIds.map((pageId) => [
          pageId,
          current.pageUnlockedAt[pageId] ?? timestamp,
        ]));
        const nextProgression = {
          ...state.progressionState,
          manhwa: {
            ...current,
            unlockedPageIds: targetPageIds,
            viewedPageIds: current.viewedPageIds.filter((pageId) => targetPageIdSet.has(pageId)),
            pageUnlockedAt,
            pageViewedAt: Object.fromEntries(Object.entries(current.pageViewedAt).filter(
              ([pageId]) => targetPageIdSet.has(pageId),
            )),
            claimedPageUnlockReceipts: targetPageIds.map((pageId) => (
              createManhwaUnlockReceiptKey(pageId)
            )),
            lastReadPageId: current.lastReadPageId && targetPageIdSet.has(current.lastReadPageId)
              ? current.lastReadPageId
              : null,
            lastReadChapterId: current.lastReadPageId && targetPageIdSet.has(current.lastReadPageId)
              ? current.lastReadChapterId
              : null,
            lastReadGlobalPageNumber: current.lastReadGlobalPageNumber !== null
              && current.lastReadGlobalPageNumber <= access.maxAccessibleGlobalPage
              ? current.lastReadGlobalPageNumber
              : null,
            lastReadAt: current.lastReadPageId && targetPageIdSet.has(current.lastReadPageId)
              ? current.lastReadAt
              : null,
          },
        };
        return projectGameProgressionCompatibility(state, nextProgression);
      });
      return changed;
    },

    unlockManhwaPage(pageId) {
      const normalizedPageId = pageId.trim();
      const page = FINAL_MANHWA_PAGE_BY_ID[normalizedPageId];
      let transaction: ManhwaUnlockTransactionResult = {
        success: false,
        alreadyUnlocked: false,
        receiptKey: `${normalizedPageId}:unlock:1`,
        costSpent: 0,
        state: get().progressionState,
        failureReason: 'invalid-page-id',
      };
      if (!page) return transaction;
      if (!page.published) {
        return {
          ...transaction,
          failureReason: 'unreleased-page',
        };
      }

      // The corrected edition is never opened by the retired shard-purchase
      // loop. Its reader window is derived from verified Story Puzzle state,
      // so a local caller cannot bypass the p7/p9 narrative gates.
      return {
        ...transaction,
        failureReason: 'story-gated',
      };
    },
  };
}
