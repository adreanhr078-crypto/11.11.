import { create } from 'zustand';

export type PlayerSyncPhase =
  | 'idle'
  | 'auth-wait'
  | 'syncing'
  | 'ready'
  | 'degraded'
  | 'error';

export type PlayerSyncStage =
  | 'IDLE'
  | 'AUTH_RESOLVING'
  | 'AUTH_READY'
  | 'TOKEN_REQUEST'
  | 'TOKEN_READY'
  | 'PLAYER_BOOTSTRAP_STARTED'
  | 'PROFILE_REQUEST'
  | 'PROFILE_READY'
  | 'PROGRESSION_REQUEST'
  | 'PROGRESSION_READY'
  | 'SAVE_REQUEST'
  | 'SAVE_READY'
  | 'OPTIONAL_REQUESTS'
  | 'PLAYER_READY'
  | 'PLAYER_DEGRADED'
  | 'PLAYER_ERROR';

export interface PlayerSyncFailure {
  stage: PlayerSyncStage;
  endpoint: string | null;
  status: number | null;
  code: string;
  message: string;
  elapsedMs: number;
}

export interface PlayerSyncStoreState {
  phase: PlayerSyncPhase;
  stage: PlayerSyncStage;
  uid: string | null;
  attempt: number;
  startedAt: number | null;
  completedAt: number | null;
  error: PlayerSyncFailure | null;
  optionalFailures: PlayerSyncFailure[];
}

const INITIAL_STATE: PlayerSyncStoreState = {
  phase: 'idle',
  stage: 'IDLE',
  uid: null,
  attempt: 0,
  startedAt: null,
  completedAt: null,
  error: null,
  optionalFailures: [],
};

export const usePlayerSyncStore = create<PlayerSyncStoreState>(() => INITIAL_STATE);

export function updatePlayerSyncState(
  state: Partial<PlayerSyncStoreState>,
): void {
  usePlayerSyncStore.setState(state);
}

export function resetPlayerSyncState(): void {
  usePlayerSyncStore.setState(INITIAL_STATE, true);
}
