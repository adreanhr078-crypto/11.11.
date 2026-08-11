import { useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import { useStoryPuzzleStore } from './storyPuzzleStore';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';
import { useGameStore } from '../../stores/gameStore';

/** Loads a read-only projection of the server ledger for counters and UI. */
export function StoryPuzzleBootstrap() {
  const status = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const load = useStoryPuzzleStore((state) => state.actions.load);
  const reset = useStoryPuzzleStore((state) => state.actions.reset);
  const snapshot = useStoryPuzzleStore((state) => state.snapshot);
  const synchronizeManhwaAccess = useGameStore(
    (state) => state.actions.synchronizeStoryPuzzleManhwaAccess,
  );

  useEffect(() => {
    if (status !== 'signed-in' || !uid) {
      reset();
      synchronizeManhwaAccess([]);
      return;
    }
    recordEchoPresenceActivity({
      kind: 'login-session-start',
      sourceId: uid,
    });
    void load();
  }, [load, reset, status, synchronizeManhwaAccess, uid]);

  useEffect(() => {
    if (!snapshot) return;
    synchronizeManhwaAccess(snapshot.entries
      .filter((entry) => entry.status === 'completed')
      .map((entry) => entry.puzzleId));
  }, [snapshot, synchronizeManhwaAccess]);

  return null;
}
