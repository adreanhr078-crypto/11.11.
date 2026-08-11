import type {
  PlayerSyncFailure,
  PlayerSyncPhase,
  PlayerSyncStage,
} from './playerSyncStore';

export interface PlayerSyncMachineState {
  phase: PlayerSyncPhase;
  stage: PlayerSyncStage;
  error: PlayerSyncFailure | null;
  optionalFailures: PlayerSyncFailure[];
}

export type PlayerSyncMachineEvent =
  | { type: 'reset' }
  | { type: 'auth_wait' }
  | { type: 'syncing'; stage: PlayerSyncStage }
  | { type: 'failure'; failure: PlayerSyncFailure }
  | { type: 'complete'; optionalFailures?: PlayerSyncFailure[] };

export const INITIAL_PLAYER_SYNC_MACHINE_STATE: PlayerSyncMachineState = {
  phase: 'idle',
  stage: 'IDLE',
  error: null,
  optionalFailures: [],
};

export function transitionPlayerSyncMachine(
  state: PlayerSyncMachineState,
  event: PlayerSyncMachineEvent,
): PlayerSyncMachineState {
  switch (event.type) {
    case 'reset':
      return INITIAL_PLAYER_SYNC_MACHINE_STATE;
    case 'auth_wait':
      return { ...state, phase: 'auth-wait', stage: 'AUTH_RESOLVING', error: null };
    case 'syncing':
      return { ...state, phase: 'syncing', stage: event.stage, error: null };
    case 'failure':
      return {
        ...state,
        phase: 'error',
        stage: 'PLAYER_ERROR',
        error: event.failure,
      };
    case 'complete': {
      const optionalFailures = event.optionalFailures ?? [];
      return {
        ...state,
        phase: optionalFailures.length > 0 ? 'degraded' : 'ready',
        stage: optionalFailures.length > 0
          ? 'PLAYER_DEGRADED'
          : 'PLAYER_READY',
        error: null,
        optionalFailures,
      };
    }
  }
}

export function isTerminalPlayerSyncPhase(phase: PlayerSyncPhase): boolean {
  return phase === 'ready' || phase === 'degraded' || phase === 'error';
}
