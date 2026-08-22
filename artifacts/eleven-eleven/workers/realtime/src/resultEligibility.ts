import type { MatchReceipt, OnlineMode } from '../../../src/domain/echo-network/contracts';

/**
 * Result eligibility belongs beside the server receipt, not in presentation
 * code.  Both the Durable Object that creates a receipt and the Queue worker
 * that persists it use these invariants so a reconnect, duplicate delivery,
 * or a new UI cannot turn an early exit into progression.
 */
export const MIN_COMPETITIVE_CHESS_DURATION_MS = 90_000;
export const MIN_COMPETITIVE_CHESS_PARTICIPATION_MS = 60_000;
export const MIN_COMPETITIVE_CHESS_PLIES = 8;
export const MIN_REWARDED_COOP_DURATION_MS = 45_000;
export const MIN_REWARDED_COOP_PARTICIPATION_MS = 45_000;

type ReceiptParticipant = MatchReceipt['participants'][number];

function isChessMode(mode: OnlineMode): boolean {
  return mode === 'chess_casual'
    || mode === 'chess_ranked_blitz'
    || mode === 'chess_ranked_rapid'
    || mode === 'chess_anomaly';
}

/**
 * Every competitive chess result must demonstrate a real contested session
 * before it can affect rewards, bonds, milestones, or ratings. A checkmate
 * alone is not enough: two colluding accounts can manufacture a terminal
 * board in a few plies just as easily as they can resign immediately.
 */
export function isChessReceiptProgressionEligible(input: {
  mode: OnlineMode;
  status: MatchReceipt['status'];
  durationMs: number;
  participants: readonly ReceiptParticipant[];
}): boolean {
  if (input.status !== 'completed'
    || !isChessMode(input.mode)
    || input.participants.length !== 2) return false;
  return input.durationMs >= MIN_COMPETITIVE_CHESS_DURATION_MS
    && input.participants.every((participant) => (
      participant.participationMs >= MIN_COMPETITIVE_CHESS_PARTICIPATION_MS
    ));
}

/**
 * The room also has the move ledger, so it adds a minimum ply requirement
 * that the Queue cannot reconstruct from a signed receipt alone.
 */
export function isChessRoomRewardEligible(input: {
  mode: OnlineMode;
  status: MatchReceipt['status'];
  durationMs: number;
  participants: readonly ReceiptParticipant[];
  plies: number;
}): boolean {
  if (!isChessReceiptProgressionEligible(input)) return false;
  return input.plies >= MIN_COMPETITIVE_CHESS_PLIES;
}

/**
 * Co-op rewards are individual.  A player must remain connected through the
 * resolved case, have accumulated meaningful active time, and submit at
 * least one accepted stage answer.  Votes alone are deliberately not a
 * reward claim: duplicate or tactical votes must never become an XP faucet.
 */
export function isCoopParticipantRewardEligible(input: {
  durationMs: number;
  participationMs: number;
  connectedAtFinalization: boolean;
  correctAnswerCount: number;
}): boolean {
  return input.durationMs >= MIN_REWARDED_COOP_DURATION_MS
    && input.participationMs >= MIN_REWARDED_COOP_PARTICIPATION_MS
    && input.connectedAtFinalization
    && input.correctAnswerCount >= 1;
}

/** Queue-side defense in depth for signed Co-op receipts. */
export function isCoopReceiptParticipantProgressionEligible(input: {
  receipt: MatchReceipt;
  participant: ReceiptParticipant;
  rewardXpAmount: number;
}): boolean {
  return input.receipt.mode === 'coop_breach'
    && input.receipt.status === 'completed'
    && input.receipt.durationMs >= MIN_REWARDED_COOP_DURATION_MS
    && input.participant.participationMs >= MIN_REWARDED_COOP_PARTICIPATION_MS
    && input.rewardXpAmount > 0;
}
