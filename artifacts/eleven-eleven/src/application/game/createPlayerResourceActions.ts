import type { GameActions } from '../../core/gameTypes';
import {
  createGameProgressionActions,
  type GameProgressionActions,
} from './createGameProgressionActions';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type PlayerResourceActions = Pick<
  GameActions,
  | 'addCurrency'
  | 'spendCurrency'
  | 'canAfford'
  | 'setCurrency'
  | 'collectMemoryFragment'
  | 'hasMemoryFragment'
  | 'resetMemoryFragments'
>;

const CAMPAIGN_SHARD_ID_PATTERN = /^page\d{2}_shard_\d{2}$/;

function normalizeCurrency(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeFragmentId(fragmentId: string): string {
  return fragmentId.trim();
}

export function createPlayerResourceActions(
  _set: GameStateSetter,
  get: GameStateGetter,
  progressionActions: GameProgressionActions = createGameProgressionActions(
    _set,
    get,
  ),
): PlayerResourceActions {
  return {
    addCurrency(amount) {
      const increment = normalizeCurrency(amount);
      if (increment === 0) return;
      progressionActions.addCoins(increment);
    },

    spendCurrency(amount) {
      const cost = normalizeCurrency(amount);
      return cost > 0 && progressionActions.spendCoins(cost);
    },

    canAfford(amount) {
      const cost = normalizeCurrency(amount);
      return cost === 0 || progressionActions.canAffordCoins(cost);
    },

    setCurrency(amount) {
      progressionActions.setCoins(normalizeCurrency(amount));
    },

    collectMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      // Campaign shards are granted only by the atomic puzzle-completion
      // transaction. The generic resource API must not mint future PDF slots.
      if (
        !id
        || CAMPAIGN_SHARD_ID_PATTERN.test(id)
        || get().progressionState.resources.memoryShards
          .discoveredShardIds.includes(id)
      ) return false;
      return progressionActions.grantMemoryShard(id);
    },

    hasMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      return Boolean(id) && get().progressionState.resources.memoryShards
        .discoveredShardIds.includes(id);
    },

    resetMemoryFragments() {
      progressionActions.resetMemoryShards();
    },
  };
}
