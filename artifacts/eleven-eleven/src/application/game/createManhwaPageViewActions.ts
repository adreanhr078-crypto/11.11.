import {
  FINAL_MANHWA_CHAPTERS,
  FINAL_MANHWA_PAGE_BY_ID,
} from '../../content/manhwa/finalManhwa';
import type {
  GameActions,
} from '../../core/gameTypes';
import type {
  ManhwaPageViewTransactionResult,
} from '../../core/manhwaPageViewTypes';
import {
  createManhwaPageEffectReceiptKey,
  MANHWA_PAGE_EFFECT_VERSION,
} from '../../core/manhwaPageViewTypes';
import {
  applyManhwaPageViewTransaction,
} from '../../domain/manhwa/manhwaPageViewTransaction';
import {
  projectGameProgressionCompatibility,
} from './createGameProgressionActions';
import {
  createManhwaPageAuthoredEffect,
} from './manhwaPageEffectAdapter';
import type {
  GameStateGetter,
  GameStateSetter,
  GameTimestampProvider,
} from './statePorts';

type ManhwaPageViewActions = Pick<
  GameActions,
  | 'viewManhwaPage'
  | 'markManhwaPageViewed'
  | 'recordManhwaReadingProgress'
  | 'markManhwaChapterCompleted'
>;

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function createManhwaPageViewActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: GameTimestampProvider = () => new Date().toISOString(),
): ManhwaPageViewActions {
  const viewManhwaPage: GameActions['viewManhwaPage'] = (
    pageId,
    timestamp = now(),
  ) => {
    const normalizedPageId = pageId.trim();
    const page = FINAL_MANHWA_PAGE_BY_ID[normalizedPageId];
    let transaction: ManhwaPageViewTransactionResult = {
      success: false,
      alreadyViewed: false,
      effectApplied: false,
      effectReceiptAdded: false,
      conflict: false,
      receiptKey: createManhwaPageEffectReceiptKey(
        normalizedPageId,
        MANHWA_PAGE_EFFECT_VERSION,
      ),
      fingerprint: '',
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
    const effect = createManhwaPageAuthoredEffect(page);

    set((state) => {
      transaction = applyManhwaPageViewTransaction(
        state.progressionState,
        normalizedPageId,
        effect,
        timestamp,
      );
      if (
        !transaction.success
        || transaction.state === state.progressionState
      ) {
        return {};
      }

      const projection = projectGameProgressionCompatibility(
        state,
        transaction.state,
      );
      if (!transaction.effectApplied) return projection;
      const dialogueLine = effect.dialogueLine;
      const projectedEcho = projection.echo ?? state.echo;

      return {
        ...projection,
        consumedDialogueTriggerIds: unique([
          ...state.consumedDialogueTriggerIds,
          ...effect.dialogueTriggers,
        ]),
        ...(dialogueLine
          ? {
              echo: {
                ...projectedEcho,
                lastDialogue: dialogueLine,
                dialogueHistory: [
                  ...projectedEcho.dialogueHistory,
                  dialogueLine,
                ].slice(-80),
              },
            }
          : {}),
      };
    });
    return transaction;
  };

  return {
    viewManhwaPage,
    markManhwaPageViewed(pageId) {
      void viewManhwaPage(pageId);
    },
    recordManhwaReadingProgress(pageId, globalPageNumber, chapterId, timestamp = now()) {
      const page = FINAL_MANHWA_PAGE_BY_ID[pageId.trim()];
      if (
        !page
        || !page.published
        || !get().progressionState.manhwa.unlockedPageIds.includes(page.id)
        || page.globalPageNumber !== globalPageNumber
        || (chapterId !== null && page.chapterId !== chapterId)
        || !timestamp.trim()
        || !Number.isFinite(Date.parse(timestamp))
      ) {
        return false;
      }

      let changed = false;
      set((state) => {
        const current = state.progressionState.manhwa;
        if (
          current.lastReadPageId === page.id
          && current.lastReadGlobalPageNumber === page.globalPageNumber
          && current.lastReadChapterId === page.chapterId
        ) {
          return {};
        }
        changed = true;
        return {
          progressionState: {
            ...state.progressionState,
            manhwa: {
              ...current,
              lastReadPageId: page.id,
              lastReadChapterId: page.chapterId === 'chapter_0' ? null : page.chapterId,
              lastReadGlobalPageNumber: page.globalPageNumber,
              lastReadAt: timestamp,
            },
          },
        };
      });
      return changed;
    },
    markManhwaChapterCompleted(chapterId) {
      if (!FINAL_MANHWA_CHAPTERS.some((chapter) => (
        chapter.chapterId === chapterId && chapter.published
      ))) {
        return false;
      }
      let changed = false;
      set((state) => {
        if (state.progressionState.manhwa.completedChapterIds.includes(chapterId)) {
          return {};
        }
        changed = true;
        return {
          progressionState: {
            ...state.progressionState,
            manhwa: {
              ...state.progressionState.manhwa,
              completedChapterIds: [
                ...state.progressionState.manhwa.completedChapterIds,
                chapterId,
              ],
            },
          },
        };
      });
      return changed;
    },
  };
}
