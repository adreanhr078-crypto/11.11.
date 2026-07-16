/**
 * memoryShardsTypes.ts — shared type definitions for Memory Shards
 * Extracted from memoryShardsSystem.ts to break circular dependency with gameStore.ts
 */

import type { StoryAct, StoryEntity } from './narrativeEngine';

export interface MemoryShard {
  id: string;
  shardId: number; // 1-219
  title: string;
  content: string;
  entity: StoryEntity;
  act: StoryAct;
  puzzleId: string;
  emotionalImpact: number; // -10 to +10
  storySignificance: 'minor' | 'major' | 'critical';
  unlocks: {
    nextPuzzle?: string;
    storyFragment?: string;
    dialogueChange?: string;
    uiEffect?: string;
  };
  theme: {
    color: string;
    audio: string;
    visualEffect: string;
  };
}
