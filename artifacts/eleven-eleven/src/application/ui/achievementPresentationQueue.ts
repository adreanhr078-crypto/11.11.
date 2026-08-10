import { create } from 'zustand';
import type { CollectionAchievementView } from '../../domain/collection/collectionContracts';

export interface AchievementPresentationRecord {
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  tier: 'standard' | 'rare' | 'system';
  rewardCosmetics: readonly string[];
}

interface AchievementPresentationQueueState {
  queue: AchievementPresentationRecord[];
  acknowledgedIds: string[];
  actions: {
    enqueue: (achievements: readonly CollectionAchievementView[]) => void;
    dismiss: () => void;
    reset: () => void;
  };
}

export const useAchievementPresentationQueue = create<AchievementPresentationQueueState>((set) => ({
  queue: [],
  acknowledgedIds: [],
  actions: {
    enqueue(achievements) {
      set((state) => {
        const acknowledged = new Set(state.acknowledgedIds);
        const queued = new Set(state.queue.map((item) => item.achievementId));
        const next = achievements
          .filter((achievement) => achievement.unlocked && !acknowledged.has(achievement.id) && !queued.has(achievement.id))
          .sort((left, right) => {
            const weight = { system: 3, rare: 2, standard: 1 } as const;
            return weight[right.presentationTier] - weight[left.presentationTier];
          })
          .map((achievement): AchievementPresentationRecord => ({
            achievementId: achievement.id,
            title: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.presentationTier,
            rewardCosmetics: achievement.reward.cosmetics,
          }));
        return {
          queue: [...state.queue, ...next],
          acknowledgedIds: [...state.acknowledgedIds, ...next.map((item) => item.achievementId)],
        };
      });
    },
    dismiss() {
      set((state) => ({ queue: state.queue.slice(1) }));
    },
    reset() {
      set({ queue: [], acknowledgedIds: [] });
    },
  },
}));

