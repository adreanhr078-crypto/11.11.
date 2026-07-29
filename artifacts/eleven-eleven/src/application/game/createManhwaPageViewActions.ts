import {
  CHAPTER_01_MANHWA_PAGE_BY_ID,
} from '../../content/puzzles/chapter01Campaign';
import type {
  GameActions,
} from '../../core/gameTypes';
import type {
  ManhwaPageViewTransactionResult,
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
  'viewManhwaPage' | 'markManhwaPageViewed'
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
    const page = CHAPTER_01_MANHWA_PAGE_BY_ID[normalizedPageId];
    let transaction: ManhwaPageViewTransactionResult = {
      success: false,
      alreadyViewed: false,
      effectApplied: false,
      effectReceiptAdded: false,
      state: get().progressionState,
      failureReason: 'invalid-page-id',
    };
    if (!page) return transaction;
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
  };
}
