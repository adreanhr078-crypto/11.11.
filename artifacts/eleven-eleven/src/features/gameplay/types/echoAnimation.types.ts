import type {
  MutableRefObject,
} from 'react';

export type EchoAnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'interact'
  | 'lockedByCinematic';

export interface EchoVisualState {
  state: EchoAnimationState;
  speed: number;
  speedNormalized: number;
  sprinting: boolean;
  frozen: boolean;
  lookYaw: number;
  turnLean: number;
}

export type EchoVisualStateRef = MutableRefObject<EchoVisualState>;

export const INITIAL_ECHO_VISUAL_STATE: EchoVisualState = {
  state: 'idle',
  speed: 0,
  speedNormalized: 0,
  sprinting: false,
  frozen: false,
  lookYaw: 0,
  turnLean: 0,
};
