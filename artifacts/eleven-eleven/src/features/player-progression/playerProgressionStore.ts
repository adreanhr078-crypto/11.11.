import { create } from 'zustand';
import type { CampaignPuzzleProgress } from '../../domain/puzzles/campaignContracts';
import type {
  LeaderboardPlayer,
} from '../../domain/player-progression/playerProgression';
import {
  PlayerProgressionApiError,
  claimPuzzleXpReward,
  fetchGlobalLeaderboard,
} from '../../infrastructure/player-progression/playerProgressionApi';

export type PlayerProgressionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

interface PlayerProgressionActions {
  loadLeaderboard: (force?: boolean) => Promise<void>;
  claimPuzzleReward: (
    puzzleId: string,
    proof: readonly CampaignPuzzleProgress[],
  ) => Promise<boolean>;
  reset: () => void;
}

export interface PlayerProgressionStoreState {
  status: PlayerProgressionStatus;
  entries: LeaderboardPlayer[];
  currentPlayer: LeaderboardPlayer | null;
  totalPlayers: number;
  generatedAt: string | null;
  error: string | null;
  actions: PlayerProgressionActions;
}

let loadSequence = 0;
let rewardSession = 0;
const inFlightRewardClaims = new Map<string, Promise<boolean>>();
const claimedRewardKeys = new Set<string>();

function friendlyProgressionError(error: unknown): string {
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'leaderboard_not_configured') {
      return 'خدمة الترتيب العالمي غير مهيأة على السيرفر بعد.';
    }
    if (error.code === 'unauthorized' || error.code === 'invalid_token') {
      return 'انتهت جلسة الحساب. سجّل الدخول من جديد.';
    }
  }
  return 'تعذر الاتصال بخدمة الترتيب العالمي. حاول مرة أخرى.';
}

export const usePlayerProgressionStore = create<
PlayerProgressionStoreState>((set, get) => ({
  status: 'idle',
  entries: [],
  currentPlayer: null,
  totalPlayers: 0,
  generatedAt: null,
  error: null,
  actions: {
    async loadLeaderboard(force = false) {
      if (!force && get().status === 'loading') return;
      const sequence = ++loadSequence;
      set({ status: 'loading', error: null });
      try {
        const snapshot = await fetchGlobalLeaderboard();
        if (sequence !== loadSequence) return;
        set({
          status: 'ready',
          entries: snapshot.entries,
          currentPlayer: snapshot.currentPlayer,
          totalPlayers: snapshot.totalPlayers,
          generatedAt: snapshot.generatedAt,
          error: null,
        });
      } catch (error) {
        if (sequence !== loadSequence) return;
        set({
          status: 'error',
          error: friendlyProgressionError(error),
        });
      }
    },

    claimPuzzleReward(puzzleId, proof) {
      const rewardKey = `puzzle:${puzzleId}:v1`;
      if (claimedRewardKeys.has(rewardKey)) return Promise.resolve(true);
      const existing = inFlightRewardClaims.get(rewardKey);
      if (existing) return existing;

      const session = rewardSession;
      const claim = (async () => {
        try {
          const response = await claimPuzzleXpReward(puzzleId, proof);
          if (session !== rewardSession) return false;
          claimedRewardKeys.add(rewardKey);
          const currentPlayer = response.progression;
          set((state) => ({
            currentPlayer,
            entries: state.entries.map((entry) => (
              entry.isCurrentPlayer ? currentPlayer : entry
            )),
          }));
          return true;
        } catch {
          return false;
        } finally {
          inFlightRewardClaims.delete(rewardKey);
        }
      })();
      inFlightRewardClaims.set(rewardKey, claim);
      return claim;
    },

    reset() {
      loadSequence += 1;
      rewardSession += 1;
      inFlightRewardClaims.clear();
      claimedRewardKeys.clear();
      set({
        status: 'idle',
        entries: [],
        currentPlayer: null,
        totalPlayers: 0,
        generatedAt: null,
        error: null,
      });
    },
  },
}));
