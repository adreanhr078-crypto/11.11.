export type LiveChallengeKind = 'daily' | 'weekly';
export type LiveChallengeMechanic =
  | 'signal'
  | 'sequence'
  | 'cipher'
  | 'wiring'
  | 'matrix';
export type LiveChallengeStatus = 'available' | 'in_progress' | 'completed';

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
  live: LiveChallengesSnapshot;
}
