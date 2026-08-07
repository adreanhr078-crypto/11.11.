import { create } from 'zustand';

export type CloudSaveStatus =
  | 'disabled'
  | 'connecting'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'error';

export interface CloudSaveState {
  status: CloudSaveStatus;
  revision: number;
  lastSyncedAt: string | null;
  message: string | null;
}

const INITIAL_STATE: CloudSaveState = {
  status: 'disabled',
  revision: 0,
  lastSyncedAt: null,
  message: null,
};

export const useCloudSaveStore = create<CloudSaveState>(() => INITIAL_STATE);

export function updateCloudSaveState(
  state: Partial<CloudSaveState>,
): void {
  useCloudSaveStore.setState(state);
}

export function resetCloudSaveState(): void {
  useCloudSaveStore.setState(INITIAL_STATE, true);
}
