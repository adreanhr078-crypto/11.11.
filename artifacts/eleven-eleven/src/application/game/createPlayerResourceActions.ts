import type { GameActions } from '../../core/gameTypes';
import type { GameStateGetter, GameStateSetter } from './statePorts';

type PlayerResourceActions = Pick<
  GameActions,
  | 'addCurrency'
  | 'spendCurrency'
  | 'setCurrency'
  | 'collectMemoryFragment'
  | 'hasMemoryFragment'
  | 'resetMemoryFragments'
>;

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

    setCurrency(amount) {
      set({ currency: normalizeCurrency(amount) });
    },

    collectMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      if (!id || get().collectedMemoryFragments.includes(id)) return false;
      set((state) => ({
        collectedMemoryFragments: [...state.collectedMemoryFragments, id],
      }));
      return true;
    },

    hasMemoryFragment(fragmentId) {
      const id = normalizeFragmentId(fragmentId);
      return Boolean(id) && get().collectedMemoryFragments.includes(id);
    },

    resetMemoryFragments() {
      set({ collectedMemoryFragments: [] });
    },
  };
}
