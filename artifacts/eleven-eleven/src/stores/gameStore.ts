/**
 * Thin Zustand adapter for the game domain.
 *
 * Domain transitions live under src/domain and application commands live
 * under src/application/game. Components keep the established import path.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CoinShopPrices,
  GameState,
} from '../core/gameTypes';
import {
  buildInitialState,
} from './gameStoreHelpers';
import { createEchoActions } from '../application/game/createEchoActions';
import { createMissionActions } from '../application/game/createMissionActions';
import { createPuzzleActions } from '../application/game/createPuzzleActions';
import { createWorldActions } from '../application/game/createWorldActions';
import {
  createPlayerResourceActions,
} from '../application/game/createPlayerResourceActions';
import {
  createGameProgressionActions,
} from '../application/game/createGameProgressionActions';
import {
  createPuzzleCampaignActions,
} from '../application/game/createPuzzleCampaignActions';
import { createNarrativeActions } from '../application/narrative/createNarrativeActions';
import { createCinematicActions } from '../application/cinematics/createCinematicActions';
import type {
  GameStateGetter,
  GameStateSetter,
} from '../application/game/statePorts';
import {
  GAME_SAVE_VERSION,
  GAME_STORAGE_NAME,
  mergeGameState,
  migrateGameState,
  partializeGameState,
} from '../infrastructure/persistence/gamePersistence';
import {
  registerAuthoredPuzzleContent,
} from '../infrastructure/content/registerPuzzleContent';

export type {
  Achievement,
  ChapterId,
  ChapterState,
  EchoMood,
  EchoState,
  Ending,
  EndingState,
  EntityId,
  FlowerStage,
  FlowerState,
  GameActions,
  GameState,
  MemoryState,
  PuzzleNode,
  PuzzleStatus,
  TimePhase,
  TimeState,
  TimelineEvent,
  WishNode,
  WishStatus,
} from '../core/gameTypes';
export type { MemoryShard } from '../core/memoryShardsTypes';
export {
  ExpandedEndingSystem,
  type ExpandedEnding,
} from '../domain/endings/endingCatalog';
export { getTrustToneModifier } from '../application/echo/getTrustToneModifier';

const DEFAULT_SHOP_PRICES: CoinShopPrices = {
  hintPrice: 50,
  skipPrice: 100,
  rerollPrice: 150,
  extraHintPrice: 30,
  rareShardPrice: 200,
};

function createInitialGameState(): GameState {
  registerAuthoredPuzzleContent();
  const state = buildInitialState();
  state.shopPrices = DEFAULT_SHOP_PRICES;
  return state;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const setState = set as GameStateSetter;
      const getState = get as GameStateGetter;
      const progressionActions = createGameProgressionActions(
        setState,
        getState,
      );
      return {
        ...createInitialGameState(),
        actions: {
          ...progressionActions,
          ...createEchoActions(setState, getState, progressionActions),
          ...createPuzzleActions(setState, getState),
          ...createMissionActions(setState, getState),
          ...createWorldActions(setState, getState),
          ...createPlayerResourceActions(
            setState,
            getState,
            progressionActions,
          ),
          ...createPuzzleCampaignActions(setState, getState),
          ...createNarrativeActions(setState, getState),
          ...createCinematicActions(setState, getState),
        },
      };
    },
    {
      name: GAME_STORAGE_NAME,
      version: GAME_SAVE_VERSION,
      migrate: migrateGameState,
      merge: mergeGameState,
      partialize: partializeGameState,
    },
  ),
);

export default useGameStore;
