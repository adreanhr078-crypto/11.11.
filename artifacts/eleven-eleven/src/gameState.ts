/**
 * gameState.ts — backward-compatibility re-exports from Zustand.
 * All state now lives in src/stores/gameStore.ts.
 */

import { useGameStore } from './stores/gameStore';

export { useGameStore as useGameState } from './stores/gameStore';

export const gameStore = {
  getState: () => useGameStore.getState(),
  incrementTrust: (amount = 1) => useGameStore.getState().actions.incrementTrust(amount),
  incrementFear: (amount = 1) => useGameStore.getState().actions.incrementFear(amount),
  incrementCuriosity: (amount = 1) => useGameStore.getState().actions.incrementCuriosity(amount),
  decrementTrust: (amount = 1) => useGameStore.getState().actions.decrementTrust(amount),
  decrementFear: (amount = 1) => useGameStore.getState().actions.decrementFear(amount),
  setLevel: (level: number) => useGameStore.getState().actions.setLevel(level),
} as const;

export { getTrustToneModifier } from './stores/gameStore';
