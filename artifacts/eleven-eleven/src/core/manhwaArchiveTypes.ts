import type { GameProgressionState } from './gameProgressionTypes';

export const MANHWA_UNLOCK_VERSION = 1;

export interface ManhwaPageAccessDefinition {
  pageId: string;
  pageNumber: number;
  prerequisitePageId?: string;
  shardCost: number;
  unlockVersion: number;
}

export type ManhwaUnlockFailureReason =
  | 'invalid-page-id'
  | 'unreleased-page'
  | 'story-gated'
  | 'invalid-page-number'
  | 'invalid-prerequisite'
  | 'invalid-cost'
  | 'invalid-version'
  | 'invalid-timestamp'
  | 'receipt-without-unlock'
  | 'previous-page-required'
  | 'insufficient-shards';

export interface ManhwaUnlockTransactionResult {
  success: boolean;
  alreadyUnlocked: boolean;
  receiptKey: string;
  costSpent: number;
  state: GameProgressionState;
  failureReason?: ManhwaUnlockFailureReason;
}

export interface ManhwaReachabilityReport {
  availableShards: number;
  totalPaidCost: number;
  spendToHighestReachablePage: number;
  remainingShards: number;
  additionalShardsRequiredForFullArchive: number;
  highestReachablePageId: string;
  highestReachablePageNumber: number;
  fullyReachable: boolean;
  unreachablePageIds: string[];
}

export function createManhwaUnlockReceiptKey(
  pageId: string,
  unlockVersion: number = MANHWA_UNLOCK_VERSION,
): string {
  return `${pageId.trim()}:unlock:${unlockVersion}`;
}

export function getManhwaUnlockReceiptPageId(
  receiptKey: string,
): string | null {
  const match = /^(.+):unlock:([1-9]\d*)$/.exec(receiptKey.trim());
  return match?.[1]?.trim() || null;
}
