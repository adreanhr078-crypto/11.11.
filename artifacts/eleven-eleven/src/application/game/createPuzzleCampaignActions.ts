import type { GameActions } from '../../core/gameTypes';
import type { GameStateGetter, GameStateSetter } from './statePorts';
import type { GameProgressionActions } from './createGameProgressionActions';

type RetiredPuzzleCampaignActions = Pick<
  GameActions,
  | 'saveCampaignPuzzleProgress'
  | 'completeCampaignPuzzle'
  | 'purchaseCampaignHint'
  | 'clearPuzzleRewardEvent'
>;

/**
 * The former local campaign is deliberately inert. These compatibility
 * actions keep an old persisted save shape readable without exposing old
 * content or granting a local reward. Phase 3 uses the server ledger instead.
 */
export function createPuzzleCampaignActions(
  set: GameStateSetter,
  _get?: GameStateGetter,
  _progressionActions?: GameProgressionActions,
): RetiredPuzzleCampaignActions {
  const unavailable = 'انتقلت الألغاز إلى قناة القصة المؤكدة خادميًا.';
  return {
    saveCampaignPuzzleProgress() {
      // Old local drafts are never migrated to official Story Puzzle progress.
    },
    completeCampaignPuzzle() {
      return { success: false, alreadyCompleted: false, message: unavailable };
    },
    purchaseCampaignHint() {
      return { success: false, alreadyUnlocked: false, message: unavailable };
    },
    clearPuzzleRewardEvent() {
      set({ lastPuzzleReward: null });
    },
  };
}
