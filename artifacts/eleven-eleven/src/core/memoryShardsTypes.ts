/**
 * memoryShardsTypes.ts — shared type definitions for Memory Shards
 * Unified type supporting both narrative engine and memory collection systems.
 */

import type { StoryAct, StoryEntity } from './narrativeEngine';

export type MemoryShardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface MemoryShard {
  // Core identification
  id: string;
  puzzleId: string;
  
  // Display properties
  title: string;
  description: string;
  icon: string;
  rarity: MemoryShardRarity;
  
  // Collection state
  collected: boolean;
  
  // Story integration
  storyFragment: string;
  act: number;
  phase: string;
  
  // Narrative engine fields
  shardId?: number;
  content?: string;
  entity?: StoryEntity;
  emotionalImpact?: number;
  storySignificance?: 'minor' | 'major' | 'critical';
  unlocks?: {
    nextPuzzle?: string;
    storyFragment?: string;
    dialogueChange?: string;
    uiEffect?: string;
  };
  theme?: {
    color: string;
    audio: string;
    visualEffect: string;
  };
}