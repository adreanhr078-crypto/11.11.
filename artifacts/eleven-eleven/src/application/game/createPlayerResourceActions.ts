import type { GameActions } from '../../core/gameTypes';
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
  set: GameStateSetter,
  get: GameStateGetter,
): PlayerResourceActions {
  return {
    addCurrency(amount) {
      const increment = normalizeCurrency(amount);
      if (increment === 0) return;
      set((state) => ({ currency: state.currency + increment }));
    },

    spendCurrency(amount) {
      const cost = normalizeCurrency(amount);
      if (cost === 0 || get().currency < cost) return false;
      set((state) => ({ currency: Math.max(0, state.currency - cost) }));
      return true;
    },

    canAfford(amount) {
      const cost = normalizeCurrency(amount);
      return get().currency >= cost;
    },

    setCurrency(amount) {
      set({ currency: normalizeCurrency(amount) });
    },

    collectMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      // Campaign shards are granted only by the atomic puzzle-completion
      // transaction. The generic resource API must not mint future PDF slots.
      if (
        !id
        || CAMPAIGN_SHARD_ID_PATTERN.test(id)
        || get().collectedMemoryFragments.includes(id)
      ) return false;
      set((state) => ({
        collectedMemoryFragments: [...state.collectedMemoryFragments, id],
        memoryFragmentCollectedAt: {
          ...state.memoryFragmentCollectedAt,
          [id]: new Date().toISOString(),
        },
        memory: {
          ...state.memory,
          fragmentsCollected: state.collectedMemoryFragments.length + 1,
        },
      }));
      return true;
    },

    hasMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      return Boolean(id) && get().collectedMemoryFragments.includes(id);
    },

    resetMemoryFragments() {
      set((state) => ({
        collectedMemoryFragments: [],
        memoryFragmentCollectedAt: {},
        integratedMemoryFragmentIds: [],
        unlockedManhwaPageIds: [],
        viewedManhwaPageIds: [],
        manhwaPageUnlockedAt: {},
        manhwaPageViewedAt: {},
        memory: {
          ...state.memory,
          fragmentsCollected: 0,
        },
      }));
    },
  };
}
