import { create } from 'zustand';
import type { CollectionSnapshot } from '../../domain/collection/collectionContracts';
import {
  PlayerProgressionApiError,
  equipPlayerCosmetic,
  fetchPlayerCollection,
  reconstructPlayerMemory,
} from '../../infrastructure/player-progression/playerProgressionApi';
import { useAchievementPresentationQueue } from '../../application/ui/achievementPresentationQueue';

export type CollectionLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CollectionStoreState {
  status: CollectionLoadStatus;
  snapshot: CollectionSnapshot | null;
  error: string | null;
  actions: {
    load: (force?: boolean) => Promise<CollectionSnapshot | null>;
    reconstruct: (chapterId: string) => Promise<CollectionSnapshot | null>;
    equip: (cosmeticId: string) => Promise<CollectionSnapshot | null>;
    reset: () => void;
  };
}

let requestVersion = 0;

function friendlyError(error: unknown): string {
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'reconstruction_locked') return 'All verified shards for this chapter are required.';
    if (error.code === 'cosmetic_not_owned') return 'This cosmetic is not unlocked.';
    if (error.code === 'unauthorized' || error.code === 'invalid_token') return 'Your session expired. Sign in again.';
  }
  return 'Unable to synchronize the recovery archive.';
}

function acceptSnapshot(snapshot: CollectionSnapshot): void {
  const unlocked = new Set(snapshot.newlyUnlockedAchievementIds);
  if (unlocked.size === 0) return;
  useAchievementPresentationQueue.getState().actions.enqueue(
    snapshot.achievements.filter((achievement) => unlocked.has(achievement.id)),
  );
}

export const useCollectionStore = create<CollectionStoreState>((set, get) => ({
  status: 'idle',
  snapshot: null,
  error: null,
  actions: {
    async load(force = false) {
      if (!force && get().status === 'loading') return get().snapshot;
      const version = ++requestVersion;
      set({ status: 'loading', error: null });
      try {
        const snapshot = await fetchPlayerCollection();
        if (version !== requestVersion) return null;
        acceptSnapshot(snapshot);
        set({ status: 'ready', snapshot, error: null });
        return snapshot;
      } catch (error) {
        if (version === requestVersion) set({ status: 'error', error: friendlyError(error) });
        return null;
      }
    },
    async reconstruct(chapterId) {
      try {
        set({ status: 'loading', error: null });
        const snapshot = await reconstructPlayerMemory(chapterId);
        acceptSnapshot(snapshot);
        set({ status: 'ready', snapshot, error: null });
        return snapshot;
      } catch (error) {
        set({ status: 'error', error: friendlyError(error) });
        return null;
      }
    },
    async equip(cosmeticId) {
      try {
        set({ status: 'loading', error: null });
        const snapshot = await equipPlayerCosmetic(cosmeticId);
        set({ status: 'ready', snapshot, error: null });
        return snapshot;
      } catch (error) {
        set({ status: 'error', error: friendlyError(error) });
        return null;
      }
    },
    reset() {
      requestVersion += 1;
      set({ status: 'idle', snapshot: null, error: null });
      useAchievementPresentationQueue.getState().actions.reset();
    },
  },
}));

