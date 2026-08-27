import { create } from 'zustand';
import type {
  LiveChallengesSnapshot,
  LiveCompletionReceipt,
} from '../../domain/live-challenges/liveChallengeContracts';
import {
  PlayerProgressionApiError,
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
type LiveChallengeLocale = 'ar' | 'en';
type LiveChallengeErrorCode = string | null;

interface LiveChallengeState {
  status: LiveLoadStatus;
  snapshot: LiveChallengesSnapshot | null;
  error: string | null;
  errorCode: LiveChallengeErrorCode;
  latestReceipt: LiveCompletionReceipt | null;
  actions: {
    load: (force?: boolean, locale?: LiveChallengeLocale) => Promise<LiveChallengesSnapshot | null>;
    saveDailyDraft: (answer?: string, locale?: LiveChallengeLocale) => Promise<LiveChallengesSnapshot | null>;
    useDailyHint: (hintIndex: number, locale?: LiveChallengeLocale) => Promise<string | null>;
    useWeeklyHint: (hintIndex: number, locale?: LiveChallengeLocale) => Promise<string | null>;
    completeDaily: (answer: string, locale?: LiveChallengeLocale) => Promise<LiveCompletionReceipt | null>;
    saveWeeklyDraft: (answer?: string, locale?: LiveChallengeLocale) => Promise<LiveChallengesSnapshot | null>;
    completeWeeklyStage: (stageIndex: number, answer: string, locale?: LiveChallengeLocale) => Promise<LiveCompletionReceipt | null>;
    clearReceipt: () => void;
    reset: () => void;
  };
}

const LIVE_ERROR_COPY = {
  ar: {
    insufficientCoins: 'لا تملك عملات موثقة كافية لفتح هذا التلميح. أكمل هدف القصة التالي ثم عُد.',
    hintOrder: 'افتح التلميح السابق أولًا.',
    completed: 'اكتملت هذه الإشارة بالفعل؛ لا يمكن شراء تلميح بعدها.',
    rejected: 'لم تستقر الإشارة بعد. راجع العلاقة وجرب تعديل اختيارك.',
    locked: 'هذا التحدي يفتح بعد التحقق من دليل القصة المطلوب.',
    unauthorized: 'انتهت جلسة الحساب. سجّل الدخول من جديد.',
    unavailable: 'تعذر الوصول إلى قناة الإشارة. حاول مرة أخرى.',
  },
  en: {
    insufficientCoins: 'You need more verified coins for this hint. Complete your next story objective, then return.',
    hintOrder: 'Open the previous hint first.',
    completed: 'This signal is already complete; hints cannot be purchased after completion.',
    rejected: 'The signal is not stable yet. Recheck the relationship and adjust your selection.',
    locked: 'This challenge opens after the required story evidence is verified.',
    unauthorized: 'Your account session ended. Sign in again.',
    unavailable: 'The signal channel could not be reached. Try again.',
  },
} as const;

function errorCode(error: unknown): LiveChallengeErrorCode {
  return error instanceof PlayerProgressionApiError ? error.code : null;
}

function message(error: unknown, locale: LiveChallengeLocale = 'ar'): string {
  const copy = LIVE_ERROR_COPY[locale];
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'insufficient_coins') return copy.insufficientCoins;
    if (error.code === 'hint_sequence_locked') return copy.hintOrder;
    if (error.code === 'daily_complete' || error.code === 'weekly_complete') return copy.completed;
    if (error.code === 'live_answer_incorrect') return copy.rejected;
    if (error.code === 'daily_story_locked' || error.code === 'weekly_story_locked' || error.code === 'rollout_disabled') return copy.locked;
    if (error.code === 'unauthorized' || error.code === 'invalid_token') return copy.unauthorized;
  }
  return copy.unavailable;
}

let dailyDraftQueue: Promise<void> = Promise.resolve();
let weeklyDraftQueue: Promise<void> = Promise.resolve();

export const useLiveChallengeStore = create<LiveChallengeState>((set, get) => ({
  status: 'idle',
  snapshot: null,
  error: null,
  errorCode: null,
  latestReceipt: null,
  actions: {
    async load(force = false, locale: LiveChallengeLocale = 'ar') {
      if (!force && get().status === 'loading') return get().snapshot;
      set({ status: 'loading', error: null, errorCode: null });
      try {
        const snapshot = await fetchLiveChallenges();
        set({ status: 'ready', snapshot, error: null, errorCode: null });
        return snapshot;
      } catch (error) {
        set({ status: 'error', error: message(error, locale), errorCode: errorCode(error) });
        return null;
      }
    },
    async saveDailyDraft(answer, locale: LiveChallengeLocale = 'ar') {
      const request = dailyDraftQueue.then(async () => {
        try {
          const snapshot = await saveDailySignalDraft(answer ? { answer } : {});
          set({ status: 'ready', snapshot, error: null, errorCode: null });
          return snapshot;
        } catch (error) {
          set({ error: message(error, locale), errorCode: errorCode(error) });
          return null;
        }
      });
      dailyDraftQueue = request.then(() => undefined, () => undefined);
      return request;
    },
    async useDailyHint(hintIndex, locale: LiveChallengeLocale = 'ar') {
      try {
        const response = await useDailySignalHint(hintIndex);
        set({ status: 'ready', snapshot: response.live, error: null, errorCode: null });
        return response.hint;
      } catch (error) {
        set({ error: message(error, locale), errorCode: errorCode(error) });
        return null;
      }
    },
    async completeDaily(answer, locale: LiveChallengeLocale = 'ar') {
      try {
        const receipt = await completeDailySignal(answer);
        set({ status: 'ready', snapshot: receipt.live, latestReceipt: receipt, error: null, errorCode: null });
        recordEchoPresenceActivity({
          kind: 'live-challenge-completed',
          sourceId: receipt.challengeId,
        });
        return receipt;
      } catch (error) {
        set({ error: message(error, locale), errorCode: errorCode(error) });
        return null;
      }
    },
    async saveWeeklyDraft(answer, locale: LiveChallengeLocale = 'ar') {
      const request = weeklyDraftQueue.then(async () => {
        try {
          const snapshot = await saveWeeklySystemTrialDraft(answer ? { answer } : {});
          set({ status: 'ready', snapshot, error: null, errorCode: null });
          return snapshot;
        } catch (error) {
          set({ error: message(error, locale), errorCode: errorCode(error) });
          return null;
        }
      });
      weeklyDraftQueue = request.then(() => undefined, () => undefined);
      return request;
    },
    async completeWeeklyStage(stageIndex, answer, locale: LiveChallengeLocale = 'ar') {
      try {
        const receipt = await completeWeeklySystemTrialStage(stageIndex, answer);
        set({ status: 'ready', snapshot: receipt.live, latestReceipt: receipt, error: null, errorCode: null });
        if (receipt.awarded) {
          recordEchoPresenceActivity({
            kind: 'live-challenge-completed',
            sourceId: receipt.challengeId,
          });
        }
        return receipt;
      } catch (error) {
        set({ error: message(error, locale), errorCode: errorCode(error) });
        return null;
      }
    },
    async useWeeklyHint(hintIndex, locale: LiveChallengeLocale = 'ar') {
      try {
        const response = await useWeeklySystemTrialHint(hintIndex);
        set({ status: 'ready', snapshot: response.live, error: null, errorCode: null });
        return response.hint;
      } catch (error) {
        set({ error: message(error, locale), errorCode: errorCode(error) });
        return null;
      }
    },
    clearReceipt() {
      set({ latestReceipt: null });
    },
    reset() {
      dailyDraftQueue = Promise.resolve();
      weeklyDraftQueue = Promise.resolve();
      set({ status: 'idle', snapshot: null, error: null, errorCode: null, latestReceipt: null });
    },
  },
}));
