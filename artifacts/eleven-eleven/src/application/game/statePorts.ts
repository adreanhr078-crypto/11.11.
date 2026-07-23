import type { GameState } from '../../core/gameTypes';

export type GameStateSetter = (
  partial:
    | Partial<GameState>
    | GameState
    | ((state: GameState) => Partial<GameState> | GameState),
) => void;

export type GameStateGetter = () => GameState;
