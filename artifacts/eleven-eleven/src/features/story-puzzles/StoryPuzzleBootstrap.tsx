import { useEffect } from 'react';
import { useAuthStore } from '../auth/authStore';
import { useStoryPuzzleStore } from './storyPuzzleStore';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';

/** Loads a read-only projection of the server ledger for counters and UI. */
export function StoryPuzzleBootstrap() {
  const status = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const load = useStoryPuzzleStore((state) => state.actions.load);
  const reset = useStoryPuzzleStore((state) => state.actions.reset);

  useEffect(() => {
    if (status !== 'signed-in' || !uid) {
      reset();
      return;
    }
    recordEchoPresenceActivity({
      kind: 'login-session-start',
      sourceId: uid,
    });
    void load();
  }, [load, reset, status, uid]);

  return null;
}
