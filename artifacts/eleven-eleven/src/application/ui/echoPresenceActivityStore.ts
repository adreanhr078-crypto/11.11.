import { create } from 'zustand';
import type {
  StoryPuzzleActivity,
  StoryPuzzleActivityKind,
} from '../../domain/story-puzzles/storyPuzzleContracts';

export interface EchoPresenceActivity extends StoryPuzzleActivity {
  sourceId?: string;
}

interface EchoPresenceActivityState {
  latestActivity: EchoPresenceActivity | null;
  actions: {
    record: (activity: EchoPresenceActivity) => void;
    clear: () => void;
  };
}

export const useEchoPresenceActivityStore = create<EchoPresenceActivityState>(
  (set) => ({
    latestActivity: null,
    actions: {
      record(activity) {
        if (!Number.isFinite(activity.occurredAt)) return;
        set({ latestActivity: activity });
      },
      clear() {
        set({ latestActivity: null });
      },
    },
  }),
);

export function recordEchoPresenceActivity(input: {
  kind: StoryPuzzleActivityKind;
  puzzleId?: string;
  sourceId?: string;
}): void {
  useEchoPresenceActivityStore.getState().actions.record({
    ...input,
    occurredAt: Date.now(),
  });
}
