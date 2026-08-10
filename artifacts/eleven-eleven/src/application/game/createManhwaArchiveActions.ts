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
  applyManhwaPageUnlockTransaction,
  createManhwaPageAccessDefinition,
} from '../../domain/manhwa/manhwaArchiveProgression';
import {
  projectGameProgressionCompatibility,
} from './createGameProgressionActions';
import type {
  GameStateGetter,
  GameStateSetter,
  GameTimestampProvider,
} from './statePorts';

type ManhwaArchiveActions = Pick<GameActions, 'unlockManhwaPage'>;

export function createManhwaArchiveActions(
  set: GameStateSetter,
  get: GameStateGetter,
  now: GameTimestampProvider = () => new Date().toISOString(),
): ManhwaArchiveActions {
  return {
    unlockManhwaPage(pageId, timestamp = now()) {
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

      const definition = createManhwaPageAccessDefinition({
        pageId: page.id,
        pageNumber: page.pageNumber,
        ...(page.prerequisitePageId
          ? { prerequisitePageId: page.prerequisitePageId }
          : {}),
      });
      set((state) => {
        transaction = applyManhwaPageUnlockTransaction(
          state.progressionState,
          definition,
          timestamp,
        );
        return transaction.success && transaction.state !== state.progressionState
          ? projectGameProgressionCompatibility(
              state,
              transaction.state,
            )
          : {};
      });
      return transaction;
    },
  };
}
