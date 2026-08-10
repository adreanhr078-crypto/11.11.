import { create } from 'zustand';
import type {
  LeaderboardPlayer,
} from '../../domain/player-progression/playerProgression';
import type {
  PlayerProfile,
  PlayerProfileUpdateInput,
} from '../../domain/player-profile/playerProfile';
import type {
  AuthoritativeStoryState,
} from '../../domain/story/storyState';
import {
  PlayerProgressionApiError,
  claimManhwaStoryCheckpoint,
  claimManhwaChapterXpReward,
  fetchAuthoritativeStoryState,
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
  loadStoryState: () => Promise<AuthoritativeStoryState | null>;
  updateProfile: (input: PlayerProfileUpdateInput) => Promise<boolean>;
  claimManhwaChapterReward: (
    chapterId: string,
    finalPageNumber: number,
  ) => Promise<boolean>;
  claimManhwaStoryCheckpoint: (input: {
    chapterId: string;
    pageId: string;
    globalPageNumber: number;
  }) => Promise<AuthoritativeStoryState | null>;
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
  storyState: AuthoritativeStoryState | null;
  storyStatus: PlayerProgressionStatus;
  storyError: string | null;
  actions: PlayerProgressionActions;
}

let loadSequence = 0;
let profileLoadSequence = 0;
let storyLoadSequence = 0;
let rewardSession = 0;
const inFlightRewardClaims = new Map<string, Promise<boolean>>();
const inFlightStoryCheckpointClaims = new Map<
  string,
  Promise<AuthoritativeStoryState | null>
>();
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

function friendlyStoryError(error: unknown): string {
  if (error instanceof PlayerProgressionApiError) {
    if (error.code === 'story_prerequisite_missing') {
      return 'Complete the preceding verified chapter first.';
    }
    if (error.code === 'story_reading_prerequisite_missing') {
      return 'Read the chapter pages in sequence before this story milestone.';
    }
    if (error.code === 'unauthorized' || error.code === 'invalid_token') {
      return 'Your session expired. Sign in again.';
    }
  }
  return 'Unable to synchronize story state.';
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
  storyState: null,
  storyStatus: 'idle',
  storyError: null,
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

    async loadStoryState() {
      if (get().storyStatus === 'loading') return null;
      const sequence = ++storyLoadSequence;
      set({ storyStatus: 'loading', storyError: null });
      try {
        const storyState = await fetchAuthoritativeStoryState();
        if (sequence !== storyLoadSequence) return null;
        set({ storyState, storyStatus: 'ready', storyError: null });
        return storyState;
      } catch (error) {
        if (sequence !== storyLoadSequence) return null;
        set({
          storyStatus: 'error',
          storyError: friendlyStoryError(error),
        });
        return null;
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

    claimManhwaChapterReward(chapterId, finalPageNumber) {
      const rewardKey = `manhwa:${chapterId}:v1`;
      if (claimedRewardKeys.has(rewardKey)) return Promise.resolve(true);
      const existing = inFlightRewardClaims.get(rewardKey);
      if (existing) return existing;

      const session = rewardSession;
      const claim = (async () => {
        try {
          const response = await claimManhwaChapterXpReward(
            chapterId,
            finalPageNumber,
          );
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

    claimManhwaStoryCheckpoint(input) {
      const checkpointKey = [
        input.chapterId,
        input.pageId,
        input.globalPageNumber,
      ].join(':');
      const existing = inFlightStoryCheckpointClaims.get(checkpointKey);
      if (existing) return existing;
      const session = rewardSession;
      const claim = (async () => {
        try {
          const response = await claimManhwaStoryCheckpoint(input);
          if (session !== rewardSession) return null;
          set({
            storyState: response.storyState,
            storyStatus: 'ready',
            storyError: null,
          });
          return response.storyState;
        } catch (error) {
          if (session === rewardSession) {
            set({
              storyStatus: 'error',
              storyError: friendlyStoryError(error),
            });
          }
          return null;
        } finally {
          inFlightStoryCheckpointClaims.delete(checkpointKey);
        }
      })();
      inFlightStoryCheckpointClaims.set(checkpointKey, claim);
      return claim;
    },

    reset() {
      loadSequence += 1;
      profileLoadSequence += 1;
      storyLoadSequence += 1;
      rewardSession += 1;
      inFlightRewardClaims.clear();
      inFlightStoryCheckpointClaims.clear();
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
      storyState: null,
      storyStatus: 'idle',
      storyError: null,
    });
    },
  },
}));
