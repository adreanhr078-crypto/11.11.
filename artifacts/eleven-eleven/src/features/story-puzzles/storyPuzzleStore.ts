import { create } from 'zustand';
import type {
  StoryPuzzleDraft,
  StoryPuzzleRewardReceipt,
  StoryPuzzleSnapshot,
  StoryPuzzleActivity,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import { STORY_PUZZLE_BY_ID } from '../../content/puzzles/storyPuzzleCatalog';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';
import {
  PlayerProgressionApiError,
  completeStoryPuzzle,
  discoverStoryPuzzle,
  fetchStoryPuzzleState,
  saveStoryPuzzleProgress,
  unlockStoryPuzzleHint,
} from '../../infrastructure/player-progression/playerProgressionApi';

export type StoryPuzzleLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface StoryPuzzleActions {
  load: (force?: boolean, expectedUid?: string) => Promise<StoryPuzzleSnapshot | null>;
  saveDraft: (puzzleId: string, draft: StoryPuzzleDraft) => Promise<StoryPuzzleSnapshot | null>;
  complete: (puzzleId: string, draft: StoryPuzzleDraft) => Promise<StoryPuzzleRewardReceipt | null>;
  discover: (puzzleId: string) => Promise<StoryPuzzleSnapshot | null>;
  unlockHint: (puzzleId: string, hintIndex: number) => Promise<StoryPuzzleSnapshot | null>;
  dismissReward: () => void;
  reset: () => void;
}

interface StoryPuzzleStoreState {
  status: StoryPuzzleLoadStatus;
  snapshot: StoryPuzzleSnapshot | null;
  error: string | null;
  latestReward: StoryPuzzleRewardReceipt | null;
  latestActivity: StoryPuzzleActivity | null;
  actions: StoryPuzzleActions;
}

let requestVersion = 0;
let loadRequest: Promise<StoryPuzzleSnapshot | null> | null = null;

function friendlyError(error: unknown): string {
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'puzzle_locked' || error.code === 'secret_not_detected') {
      return 'لم يتم التحقق من دليل القصة المطلوب بعد.';
    }
    if (error.code === 'insufficient_coins') {
      return 'لا تملك عملات موثقة كافية لفتح هذا التلميح.';
    }
    if (error.code === 'puzzle_not_verified') {
      return 'الاستعادة غير مكتملة بعد. راجع الإشارة وحاول مجددًا.';
    }
    if (error.code === 'unauthorized' || error.code === 'invalid_token') {
      return 'انتهت جلسة الحساب. سجّل الدخول من جديد.';
    }
  }
  return 'تعذر الاتصال بقناة الألغاز. حاول مرة أخرى.';
}

export const useStoryPuzzleStore = create<StoryPuzzleStoreState>((set, get) => ({
  status: 'idle',
  snapshot: null,
  error: null,
  latestReward: null,
  latestActivity: null,
  actions: {
    async load(force = false, expectedUid?: string) {
      if (loadRequest) return loadRequest;
      const version = ++requestVersion;
      set({ status: 'loading', error: null });
      const request = (async () => {
        try {
          const snapshot = await fetchStoryPuzzleState(expectedUid);
          if (version === requestVersion) {
            set({ status: 'ready', snapshot, error: null, latestActivity: null });
          }
          return snapshot;
        } catch (error) {
          if (version === requestVersion) set({ status: 'error', error: friendlyError(error) });
          return null;
        }
      })();
      loadRequest = request;
      try {
        return await request;
      } finally {
        if (loadRequest === request) loadRequest = null;
      }
    },

    async saveDraft(puzzleId, draft) {
      try {
        const snapshot = await saveStoryPuzzleProgress(puzzleId, draft);
        set({ status: 'ready', snapshot, error: null });
        return snapshot;
      } catch (error) {
        const rejected = error instanceof PlayerProgressionApiError
          && error.code === 'puzzle_not_verified';
        set({
          error: friendlyError(error),
          latestActivity: rejected
            ? { kind: 'puzzle-attempt-rejected', puzzleId, occurredAt: Date.now() }
            : null,
        });
        if (rejected) recordEchoPresenceActivity({ kind: 'puzzle-attempt-rejected', puzzleId });
        return null;
      }
    },

    async complete(puzzleId, draft) {
      try {
        const receipt = await completeStoryPuzzle(puzzleId, draft);
        const puzzle = STORY_PUZZLE_BY_ID[puzzleId];
        const kind: StoryPuzzleActivity['kind'] = receipt.snapshot.shardCount >= 20
          ? 'all-20-shards-found'
          : puzzle?.classification === 'secret'
            ? 'secret-puzzle-solved'
            : receipt.snapshot.entries.find((entry) => entry.puzzleId === puzzleId)?.perfectSolve
              ? 'perfect-solve'
              : 'main-puzzle-solved';
        set({
          status: 'ready',
          snapshot: receipt.snapshot,
          error: null,
          latestReward: receipt,
          latestActivity: { kind, puzzleId, occurredAt: Date.now() },
        });
        recordEchoPresenceActivity({ kind, puzzleId });
        return receipt;
      } catch (error) {
        const rejected = error instanceof PlayerProgressionApiError
          && error.code === 'puzzle_not_verified';
        set({
          error: friendlyError(error),
          latestActivity: rejected
            ? { kind: 'puzzle-attempt-rejected', puzzleId, occurredAt: Date.now() }
            : null,
        });
        if (rejected) recordEchoPresenceActivity({ kind: 'puzzle-attempt-rejected', puzzleId });
        return null;
      }
    },

    async discover(puzzleId) {
      try {
        const snapshot = await discoverStoryPuzzle(puzzleId);
        set({
          status: 'ready',
          snapshot,
          error: null,
          latestActivity: {
            kind: 'secret-puzzle-discovered',
            puzzleId,
            occurredAt: Date.now(),
          },
        });
        recordEchoPresenceActivity({ kind: 'secret-puzzle-discovered', puzzleId });
        return snapshot;
      } catch (error) {
        set({ error: friendlyError(error) });
        return null;
      }
    },

    async unlockHint(puzzleId, hintIndex) {
      try {
        const response = await unlockStoryPuzzleHint(puzzleId, hintIndex);
        set({
          status: 'ready',
          snapshot: response.puzzleState,
          error: null,
          latestActivity: {
            kind: 'hint-used',
            puzzleId,
            occurredAt: Date.now(),
          },
        });
        recordEchoPresenceActivity({ kind: 'hint-used', puzzleId });
        return response.puzzleState;
      } catch (error) {
        set({ error: friendlyError(error) });
        return null;
      }
    },

    dismissReward() {
      set({ latestReward: null });
    },

    reset() {
      requestVersion += 1;
      loadRequest = null;
      set({
        status: 'idle',
        snapshot: null,
        error: null,
        latestReward: null,
        latestActivity: null,
      });
    },
  },
}));
