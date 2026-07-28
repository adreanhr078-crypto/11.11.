import type { GameState } from '../../core/gameTypes';

export type GameStateUpdate =
  | Partial<GameState>
  | GameState
  | ((state: GameState) => Partial<GameState> | GameState);

export type GameStateSetter = (
  partial: GameStateUpdate,
) => void;

export type GameStateGetter = () => GameState;

export type GameTimestampProvider = () => string;
