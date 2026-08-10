export type StoryPuzzleClassification = 'main' | 'secret';

export type StoryPuzzleDifficulty = 'intro' | 'standard' | 'advanced' | 'final';

export type StoryPuzzleMechanic =
  | 'signal'
  | 'sequence'
  | 'image-reconstruction'
  | 'wiring'
  | 'color-routing'
  | 'cipher'
  | 'evidence'
  | 'pattern-scan'
  | 'timeline'
  | 'memory-grid'
  | 'data-route'
  | 'mirror-code'
  | 'visual-forensics'
  | 'matrix'
  | 'multi-stage'
  | 'contradiction'
  | 'deduction';

export interface StoryPuzzleText {
  ar: string;
  en: string;
}

export interface StoryPuzzleOption {
  id: string;
  label: StoryPuzzleText;
  symbol?: string;
}

export interface StoryPuzzleImageSource {
  src: string;
  alt: StoryPuzzleText;
  /** Source aspect ratio is retained while the engine crops it into pieces. */
  aspectRatio?: number;
  rows: number;
  columns: number;
  allowRotation: boolean;
}

export interface StoryPuzzleStage {
  id: string;
  mechanic: Exclude<StoryPuzzleMechanic, 'multi-stage'>;
  objective: StoryPuzzleText;
  options?: readonly StoryPuzzleOption[];
}

export interface StoryPuzzleDefinition {
  id: string;
  order: number;
  chapterId: 'chapter_1' | 'chapter_2' | 'chapter_3' | 'chapter_4';
  classification: StoryPuzzleClassification;
  title: StoryPuzzleText;
  objective: StoryPuzzleText;
  mechanic: StoryPuzzleMechanic;
  difficulty: StoryPuzzleDifficulty;
  /** A verified Manhwa reader record, never a client-created Canon event. */
  source: {
    pageId: string;
    globalPageNumber: number;
    requiredCanonEventId?: string;
  };
  prerequisitePuzzleIds: readonly string[];
  hints: readonly [StoryPuzzleText, StoryPuzzleText, StoryPuzzleText];
  completionMessage: StoryPuzzleText;
  options?: readonly StoryPuzzleOption[];
  image?: StoryPuzzleImageSource;
  stages?: readonly StoryPuzzleStage[];
  /** The main puzzle that presents the optional visual anomaly. */
  anomalyHostPuzzleId?: string;
}

export type StoryPuzzleStatus =
  | 'hidden'
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed';

export interface StoryPuzzleDraft {
  stageIndex: number;
  tokens: string[];
  assignments: Record<string, string>;
  imageOrder: string[];
  rotations: Record<string, number>;
}

export interface StoryPuzzleSnapshotEntry {
  puzzleId: string;
  status: StoryPuzzleStatus;
  discovered: boolean;
  completedAt: string | null;
  perfectSolve: boolean;
  unlockedHintIndexes: number[];
  hintCosts: [number, number, number];
  draft: StoryPuzzleDraft | null;
}

export interface StoryPuzzleSnapshot {
  coinBalance: number;
  shardCount: number;
  mainCompletedCount: number;
  totalCompletedCount: number;
  entries: StoryPuzzleSnapshotEntry[];
  discoverableSecretPuzzleIds: string[];
  syncedAt: string;
}

export type StoryPuzzleActivityKind =
  | 'login-session-start'
  | 'main-puzzle-solved'
  | 'secret-puzzle-discovered'
  | 'secret-puzzle-solved'
  | 'perfect-solve'
  | 'hint-used'
  | 'memory-shard-acquired'
  | 'all-chapter-shards-found'
  | 'all-20-shards-found'
  | 'chapter-completed'
  | 'live-challenge-completed';

/** Session activity derived from verified server responses; never a reward claim. */
export interface StoryPuzzleActivity {
  kind: StoryPuzzleActivityKind;
  puzzleId?: string;
  sourceId?: string;
  occurredAt: number;
}

export interface StoryPuzzleRewardReceipt {
  awarded: boolean;
  puzzleId: string;
  xpGranted: number;
  coinsGranted: number;
  perfectBonusCoins: number;
  shardId: string;
  snapshot: StoryPuzzleSnapshot;
}
