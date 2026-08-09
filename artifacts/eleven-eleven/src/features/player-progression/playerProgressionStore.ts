import { create } from 'zustand';
import type { CampaignPuzzleProgress } from '../../domain/puzzles/campaignContracts';
import type {
  LeaderboardPlayer,
} from '../../domain/player-progression/playerProgression';
import type {
  PlayerProfile,
  PlayerProfileUpdateInput,
} from '../../domain/player-profile/playerProfile';
import {
  PlayerProgressionApiError,
  claimPuzzleXpReward,
  fetchGlobalLeaderboard,
  fetchPlayerProfile,
  updatePlayerProfile,
} from '../../infrastructure/player-progression/playerProgressionApi';

export type PlayerProgressionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

interface PlayerProgressionActions {
  loadLeaderboard: (force?: boolean) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (input: PlayerProfileUpdateInput) => Promise<boolean>;
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
  profile: PlayerProfile | null;
  profileStatus: PlayerProgressionStatus;
  profileError: string | null;
  actions: PlayerProgressionActions;
}

let loadSequence = 0;
let profileLoadSequence = 0;
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

function friendlyProfileError(error: unknown): string {
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'username_taken') {
      return 'This username is already in use.';
    }
    if (error.code === 'invalid_avatar') {
      return 'Choose one of the fixed in-game avatars.';
    }
    if (error.code === 'unauthorized' || error.code === 'invalid_token') {
      return 'Your session expired. Sign in again.';
    }
  }
  return 'Unable to load the player profile. Try again.';
}

export const usePlayerProgressionStore = create<
PlayerProgressionStoreState>((set, get) => ({
  status: 'idle',
  entries: [],
  currentPlayer: null,
  totalPlayers: 0,
  generatedAt: null,
  error: null,
  profile: null,
  profileStatus: 'idle',
  profileError: null,
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

    async loadProfile() {
      // Auth bootstrap and reward reconciliation can ask for the same profile
      // during one tick. Keep one authoritative request in flight so a
      // transient failure cannot overwrite a successful response.
      if (get().profileStatus === 'loading') return;
      const sequence = ++profileLoadSequence;
      set({ profileStatus: 'loading', profileError: null });
      try {
        const profile = await fetchPlayerProfile();
        if (sequence !== profileLoadSequence) return;
        set({ profile, profileStatus: 'ready', profileError: null });
      } catch (error) {
        if (sequence !== profileLoadSequence) return;
        set({
          profileStatus: 'error',
          profileError: friendlyProfileError(error),
        });
      }
    },

    async updateProfile(input) {
      try {
        set({ profileStatus: 'loading', profileError: null });
        const profile = await updatePlayerProfile(input);
        set((state) => ({
          profile,
          profileStatus: 'ready',
          profileError: null,
          currentPlayer: state.currentPlayer
            ? {
              ...state.currentPlayer,
              ...profile.progression,
              username: profile.username,
            }
            : state.currentPlayer,
        }));
        return true;
      } catch (error) {
        set({
          profileStatus: 'error',
          profileError: friendlyProfileError(error),
        });
        return false;
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
      profileLoadSequence += 1;
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
      profile: null,
      profileStatus: 'idle',
      profileError: null,
    });
    },
  },
}));
