import { create } from 'zustand';
import type {
  LiveChallengesSnapshot,
  LiveCompletionReceipt,
} from '../../domain/live-challenges/liveChallengeContracts';
import {
  completeDailySignal,
  completeWeeklySystemTrialStage,
  fetchLiveChallenges,
  saveDailySignalDraft,
  saveWeeklySystemTrialDraft,
  useDailySignalHint,
  useWeeklySystemTrialHint,
} from '../../infrastructure/player-progression/playerProgressionApi';
import { recordEchoPresenceActivity } from '../../application/ui/echoPresenceActivityStore';

type LiveLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LiveChallengeState {
  status: LiveLoadStatus;
  snapshot: LiveChallengesSnapshot | null;
  error: string | null;
  latestReceipt: LiveCompletionReceipt | null;
  actions: {
    load: (force?: boolean) => Promise<LiveChallengesSnapshot | null>;
    saveDailyDraft: (answer?: string) => Promise<LiveChallengesSnapshot | null>;
    useDailyHint: (hintIndex: number) => Promise<string | null>;
    useWeeklyHint: (hintIndex: number) => Promise<string | null>;
    completeDaily: (answer: string) => Promise<LiveCompletionReceipt | null>;
    saveWeeklyDraft: (answer?: string) => Promise<LiveChallengesSnapshot | null>;
    completeWeeklyStage: (stageIndex: number, answer: string) => Promise<LiveCompletionReceipt | null>;
    clearReceipt: () => void;
    reset: () => void;
  };
}

function message(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'تعذر الوصول إلى قناة الإشارة. حاول مرة أخرى.';
}

let dailyDraftQueue: Promise<void> = Promise.resolve();
let weeklyDraftQueue: Promise<void> = Promise.resolve();

export const useLiveChallengeStore = create<LiveChallengeState>((set, get) => ({
  status: 'idle',
  snapshot: null,
  error: null,
  latestReceipt: null,
  actions: {
    async load(force = false) {
      if (!force && get().status === 'loading') return get().snapshot;
      set({ status: 'loading', error: null });
      try {
        const snapshot = await fetchLiveChallenges();
        set({ status: 'ready', snapshot, error: null });
        return snapshot;
      } catch (error) {
        set({ status: 'error', error: message(error) });
        return null;
      }
    },
    async saveDailyDraft(answer) {
      const request = dailyDraftQueue.then(async () => {
        try {
          const snapshot = await saveDailySignalDraft(answer ? { answer } : {});
          set({ status: 'ready', snapshot, error: null });
          return snapshot;
        } catch (error) {
          set({ error: message(error) });
          return null;
        }
      });
      dailyDraftQueue = request.then(() => undefined, () => undefined);
      return request;
    },
    async useDailyHint(hintIndex) {
      try {
        const response = await useDailySignalHint(hintIndex);
        set({ status: 'ready', snapshot: response.live, error: null });
        return response.hint;
      } catch (error) {
        set({ error: message(error) });
        return null;
      }
    },
    async completeDaily(answer) {
      try {
        const receipt = await completeDailySignal(answer);
        set({ status: 'ready', snapshot: receipt.live, latestReceipt: receipt, error: null });
        recordEchoPresenceActivity({
          kind: 'live-challenge-completed',
          sourceId: receipt.challengeId,
        });
        return receipt;
      } catch (error) {
        set({ error: message(error) });
        return null;
      }
    },
    async saveWeeklyDraft(answer) {
      const request = weeklyDraftQueue.then(async () => {
        try {
          const snapshot = await saveWeeklySystemTrialDraft(answer ? { answer } : {});
          set({ status: 'ready', snapshot, error: null });
          return snapshot;
        } catch (error) {
          set({ error: message(error) });
          return null;
        }
      });
      weeklyDraftQueue = request.then(() => undefined, () => undefined);
      return request;
    },
    async completeWeeklyStage(stageIndex, answer) {
      try {
        const receipt = await completeWeeklySystemTrialStage(stageIndex, answer);
        set({ status: 'ready', snapshot: receipt.live, latestReceipt: receipt, error: null });
        if (receipt.awarded) {
          recordEchoPresenceActivity({
            kind: 'live-challenge-completed',
            sourceId: receipt.challengeId,
          });
        }
        return receipt;
      } catch (error) {
        set({ error: message(error) });
        return null;
      }
    },
    async useWeeklyHint(hintIndex) {
      try {
        const response = await useWeeklySystemTrialHint(hintIndex);
        set({ status: 'ready', snapshot: response.live, error: null });
        return response.hint;
      } catch (error) {
        set({ error: message(error) });
        return null;
      }
    },
    clearReceipt() {
      set({ latestReceipt: null });
    },
    reset() {
      dailyDraftQueue = Promise.resolve();
      weeklyDraftQueue = Promise.resolve();
      set({ status: 'idle', snapshot: null, error: null, latestReceipt: null });
    },
  },
}));
