import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from './playerProgressionStore';
import { useCollectionStore } from '../collection/collectionStore';

export function PlayerProgressionBootstrap() {
  const authStatus = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const loadLeaderboard = usePlayerProgressionStore(
    (state) => state.actions.loadLeaderboard,
  );
  const loadProfile = usePlayerProgressionStore(
    (state) => state.actions.loadProfile,
  );
  const loadStoryState = usePlayerProgressionStore(
    (state) => state.actions.loadStoryState,
  );
  const syncAuthoritativeStoryState = useGameStore(
    (state) => state.actions.syncAuthoritativeStoryState,
  );
  const reset = usePlayerProgressionStore((state) => state.actions.reset);
  const loadCollection = useCollectionStore((state) => state.actions.load);
  const resetCollection = useCollectionStore((state) => state.actions.reset);

  useEffect(() => {
    if (authStatus !== 'signed-in' || !uid) {
      reset();
      resetCollection();
      return;
    }
    void Promise.all([
      loadLeaderboard(true),
      loadProfile(),
      loadStoryState(),
      loadCollection(true),
    ]).then(([, , storyState]) => {
      if (storyState) syncAuthoritativeStoryState(storyState);
    });
  }, [
    authStatus,
    loadLeaderboard,
    loadProfile,
    loadStoryState,
    loadCollection,
    reset,
    resetCollection,
    syncAuthoritativeStoryState,
    uid,
  ]);

  return null;
}
