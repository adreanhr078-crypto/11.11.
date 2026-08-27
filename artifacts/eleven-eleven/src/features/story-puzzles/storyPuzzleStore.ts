import { create } from 'zustand';
import type {
  StoryPuzzleDraft,
  StoryPuzzleRewardReceipt,
  StoryPuzzleSnapshot,
  StoryPuzzleActivity,
} from '../../domain/story-puzzles/storyPuzzleContracts';
import type { NetworkLocale } from '../../domain/echo-network/contracts';
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
export type StoryPuzzleErrorCode = string | null;

interface StoryPuzzleActions {
  load: (force?: boolean, expectedUid?: string, locale?: NetworkLocale) => Promise<StoryPuzzleSnapshot | null>;
  saveDraft: (puzzleId: string, draft: StoryPuzzleDraft, locale?: NetworkLocale) => Promise<StoryPuzzleSnapshot | null>;
  complete: (puzzleId: string, draft: StoryPuzzleDraft, locale?: NetworkLocale) => Promise<StoryPuzzleRewardReceipt | null>;
  discover: (puzzleId: string, locale?: NetworkLocale) => Promise<StoryPuzzleSnapshot | null>;
  unlockHint: (puzzleId: string, hintIndex: number, locale?: NetworkLocale) => Promise<StoryPuzzleSnapshot | null>;
  dismissReward: () => void;
  reset: () => void;
}

interface StoryPuzzleStoreState {
  status: StoryPuzzleLoadStatus;
  snapshot: StoryPuzzleSnapshot | null;
  error: string | null;
  errorCode: StoryPuzzleErrorCode;
  latestReward: StoryPuzzleRewardReceipt | null;
  latestActivity: StoryPuzzleActivity | null;
  actions: StoryPuzzleActions;
}

let requestVersion = 0;
let loadRequest: Promise<StoryPuzzleSnapshot | null> | null = null;

const STORY_PUZZLE_ERROR_COPY = {
  ar: {
    locked: 'لم يتم التحقق من دليل القصة المطلوب بعد.',
    insufficientCoins: 'لا تملك عملات موثقة كافية لفتح هذا التلميح.',
    completed: 'اكتمل هذا اللغز بالفعل؛ لا يمكن شراء تلميح بعد إصدار الإيصال.',
    rejected: 'الاستعادة غير مكتملة بعد. راجع الإشارة وحاول مجددًا.',
    unauthorized: 'انتهت جلسة الحساب. سجّل الدخول من جديد.',
    unavailable: 'تعذر الاتصال بقناة الألغاز. حاول مرة أخرى.',
  },
  en: {
    locked: 'The required story evidence has not been verified yet.',
    insufficientCoins: 'You do not have enough verified coins to open this hint.',
    completed: 'This puzzle is already complete; hints cannot be purchased after its receipt is issued.',
    rejected: 'The recovery is not complete yet. Recheck the signal and try again.',
    unauthorized: 'Your account session ended. Sign in again.',
    unavailable: 'The puzzle channel could not be reached. Try again.',
  },
} as const;

export function friendlyError(error: unknown, locale: NetworkLocale = 'ar'): string {
  const copy = STORY_PUZZLE_ERROR_COPY[locale];
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'puzzle_locked' || error.code === 'secret_not_detected') {
      return copy.locked;
    }
    if (error.code === 'insufficient_coins') {
      return copy.insufficientCoins;
    }
    if (error.code === 'puzzle_completed') {
      return copy.completed;
    }
    if (error.code === 'puzzle_not_verified') {
      return copy.rejected;
    }
    if (error.code === 'unauthorized' || error.code === 'invalid_token') {
      return copy.unauthorized;
    }
  }
  return copy.unavailable;
}

function codeForError(error: unknown): StoryPuzzleErrorCode {
  return error instanceof PlayerProgressionApiError ? error.code : null;
}

export const useStoryPuzzleStore = create<StoryPuzzleStoreState>((set, get) => ({
  status: 'idle',
  snapshot: null,
  error: null,
  errorCode: null,
  latestReward: null,
  latestActivity: null,
  actions: {
    async load(force = false, expectedUid?: string, locale: NetworkLocale = 'ar') {
      if (loadRequest) return loadRequest;
      const version = ++requestVersion;
      set({ status: 'loading', error: null, errorCode: null });
      const request = (async () => {
        try {
          const snapshot = await fetchStoryPuzzleState(expectedUid);
          if (version === requestVersion) {
            set({ status: 'ready', snapshot, error: null, errorCode: null, latestActivity: null });
          }
          return snapshot;
        } catch (error) {
          if (version === requestVersion) set({
            status: 'error',
            error: friendlyError(error, locale),
            errorCode: codeForError(error),
          });
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

    async saveDraft(puzzleId, draft, locale: NetworkLocale = 'ar') {
      try {
        const snapshot = await saveStoryPuzzleProgress(puzzleId, draft);
        set({ status: 'ready', snapshot, error: null, errorCode: null });
        return snapshot;
      } catch (error) {
        const rejected = error instanceof PlayerProgressionApiError
          && error.code === 'puzzle_not_verified';
        set({
          error: friendlyError(error, locale),
          errorCode: codeForError(error),
          latestActivity: rejected
            ? { kind: 'puzzle-attempt-rejected', puzzleId, occurredAt: Date.now() }
            : null,
        });
        if (rejected) recordEchoPresenceActivity({ kind: 'puzzle-attempt-rejected', puzzleId });
        return null;
      }
    },

    async complete(puzzleId, draft, locale: NetworkLocale = 'ar') {
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
          errorCode: null,
          latestReward: receipt,
          latestActivity: { kind, puzzleId, occurredAt: Date.now() },
        });
        recordEchoPresenceActivity({ kind, puzzleId });
        return receipt;
      } catch (error) {
        const rejected = error instanceof PlayerProgressionApiError
          && error.code === 'puzzle_not_verified';
        set({
          error: friendlyError(error, locale),
          errorCode: codeForError(error),
          latestActivity: rejected
            ? { kind: 'puzzle-attempt-rejected', puzzleId, occurredAt: Date.now() }
            : null,
        });
        if (rejected) recordEchoPresenceActivity({ kind: 'puzzle-attempt-rejected', puzzleId });
        return null;
      }
    },

    async discover(puzzleId, locale: NetworkLocale = 'ar') {
      try {
        const snapshot = await discoverStoryPuzzle(puzzleId);
        set({
          status: 'ready',
          snapshot,
          error: null,
          errorCode: null,
          latestActivity: {
            kind: 'secret-puzzle-discovered',
            puzzleId,
            occurredAt: Date.now(),
          },
        });
        recordEchoPresenceActivity({ kind: 'secret-puzzle-discovered', puzzleId });
        return snapshot;
      } catch (error) {
        set({ error: friendlyError(error, locale), errorCode: codeForError(error) });
        return null;
      }
    },

    async unlockHint(puzzleId, hintIndex, locale: NetworkLocale = 'ar') {
      try {
        const response = await unlockStoryPuzzleHint(puzzleId, hintIndex);
        set({
          status: 'ready',
          snapshot: response.puzzleState,
          error: null,
          errorCode: null,
          latestActivity: {
            kind: 'hint-used',
            puzzleId,
            occurredAt: Date.now(),
          },
        });
        recordEchoPresenceActivity({ kind: 'hint-used', puzzleId });
        return response.puzzleState;
      } catch (error) {
        set({ error: friendlyError(error, locale), errorCode: codeForError(error) });
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
        errorCode: null,
        latestReward: null,
        latestActivity: null,
      });
    },
  },
}));
