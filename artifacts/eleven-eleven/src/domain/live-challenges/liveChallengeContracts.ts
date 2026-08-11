export type LiveChallengeKind = 'daily' | 'weekly';
export type LiveChallengeMechanic =
  | 'memory-fragment'
  | 'wiring'
  | 'cipher'
  | 'sequence'
  | 'matrix'
  | 'timeline'
  | 'pattern-scan'
  | 'evidence-match'
  | 'routing'
  | 'load-balance'
  | 'order-logic'
  | 'signal'
  | 'sequence'
  | 'cipher'
  | 'wiring'
  | 'matrix'
  | 'pattern'
  | 'timeline'
  | 'logic'
  | 'checksum'
  | 'routing';
export type LiveChallengeStatus = 'available' | 'in_progress' | 'completed';

export type LiveChallengeRewardTier = 'standard' | 'rare';
export type LiveChallengeRewardKind = 'gift' | 'memory-shard';

export interface LiveChallengeReward {
  tier: LiveChallengeRewardTier;
  kind: LiveChallengeRewardKind;
  label: string;
  icon: string;
}

export type LiveChallengeVisual =
  | {
    kind: 'memory-fragment';
    imageSrc: string;
    alt: string;
    rows: number;
    columns: number;
    pieces: readonly {
      id: string;
      label: string;
      backgroundPosition: string;
    }[];
  }
  | {
    kind: 'wiring';
    sources: readonly { id: string; label: string }[];
    targets: readonly { id: string; label: string; detail: string }[];
  }
  | {
    kind: 'cipher';
    encoded: string;
    shift: number;
    alphabet: string;
  }
  | {
    kind: 'choice';
    layout: 'sequence' | 'matrix' | 'timeline' | 'pattern' | 'evidence' | 'routing' | 'balance' | 'order';
    items: readonly { label: string; detail?: string }[];
  };

export interface LiveChallengePublicDefinition {
  id: string;
  kind: LiveChallengeKind;
  periodKey: string;
  version: string;
  mechanic: LiveChallengeMechanic;
  title: string;
  instructions: string;
  prompt: string;
  options: readonly string[];
  difficulty?: 'standard' | 'focused' | 'deep';
  visual?: LiveChallengeVisual;
  reward?: LiveChallengeReward;
  stageIndex?: number;
  stageCount?: number;
}

export interface LiveDailySnapshot {
  status: LiveChallengeStatus;
  challenge: LiveChallengePublicDefinition;
  periodKey: string;
  serverNow: string;
  nextResetAt: string;
  hintsUsed: number;
  perfectSolve: boolean;
  completedAt: string | null;
}

export interface LiveWeeklySnapshot {
  status: LiveChallengeStatus;
  weekId: string;
  weekStartsAt: string;
  nextResetAt: string;
  trial: LiveChallengePublicDefinition & { stages: readonly LiveChallengePublicDefinition[] };
  currentStage: number;
  completedStages: number;
  totalStages: number;
  hintsUsed: number;
  currentStageHintsUsed: number;
  score: number;
  completedAt: string | null;
  recoveryCompletedDays: number;
  recoveryTargetDays: 5;
  recoveryRewardClaimed: boolean;
  perfectWeek: boolean;
}

export interface LiveDailyHistoryEntry {
  periodKey: string;
  status: LiveChallengeStatus;
  perfectSolve: boolean;
  completedAt: string | null;
}

export interface LiveChallengesSnapshot {
  daily: LiveDailySnapshot;
  weekly: LiveWeeklySnapshot;
  dailyHistory: readonly LiveDailyHistoryEntry[];
  timezone: 'UTC';
  resetLabel: '11:11';
  balanceVersion: string;
  mastery: {
    dailySignalsRecovered: number;
    weeklyTrialsCompleted: number;
  };
}

export interface LiveCompletionReceipt {
  kind: LiveChallengeKind;
  challengeId: string;
  awarded: boolean;
  perfectSolve: boolean;
  xpGranted: number;
  coinsGranted: number;
  reward?: LiveChallengeReward;
  live: LiveChallengesSnapshot;
}
