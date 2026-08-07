import { useEffect } from 'react';
import {
  CHAPTER_01_PUZZLE_BY_ID,
} from '../../content/puzzles/chapter01Campaign';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../auth/authStore';
import { usePlayerProgressionStore } from './playerProgressionStore';

export function PlayerProgressionBootstrap() {
  const authStatus = useAuthStore((state) => state.status);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const completedPuzzleIds = useGameStore((state) => (
    state.progressionState.puzzles.journey.completedPuzzleIds
  ));
  const progressByPuzzleId = useGameStore((state) => (
    state.progressionState.puzzles.campaignProgressByPuzzleId
  ));
  const loadLeaderboard = usePlayerProgressionStore(
    (state) => state.actions.loadLeaderboard,
  );
  const claimPuzzleReward = usePlayerProgressionStore(
    (state) => state.actions.claimPuzzleReward,
  );
  const reset = usePlayerProgressionStore((state) => state.actions.reset);

  useEffect(() => {
    if (authStatus !== 'signed-in' || !uid) {
      reset();
      return;
    }
    void loadLeaderboard(true);
  }, [authStatus, loadLeaderboard, reset, uid]);

  useEffect(() => {
    if (authStatus !== 'signed-in' || !uid) return;
    let cancelled = false;
    const orderedPuzzleIds = [...completedPuzzleIds].sort((left, right) => (
      (CHAPTER_01_PUZZLE_BY_ID[left]?.order ?? Number.MAX_SAFE_INTEGER)
      - (CHAPTER_01_PUZZLE_BY_ID[right]?.order ?? Number.MAX_SAFE_INTEGER)
    ));
    void (async () => {
      for (const puzzleId of orderedPuzzleIds) {
        if (cancelled) return;
        const proof = progressByPuzzleId[puzzleId];
        if (!proof) continue;
        const synced = await claimPuzzleReward(puzzleId, proof);
        if (!synced) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    authStatus,
    claimPuzzleReward,
    completedPuzzleIds,
    progressByPuzzleId,
    uid,
  ]);

  return null;
}
