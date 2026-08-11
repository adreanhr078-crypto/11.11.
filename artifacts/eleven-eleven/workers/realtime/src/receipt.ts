import { z } from 'zod';
import {
  matchReceiptSchema,
  type MatchReceipt,
  type OnlineMode,
} from '../../../src/domain/echo-network/contracts';
import { hmacSha256Hex } from '../../../src/domain/echo-network/realtimeTicket';

export const queuedResultSchema = z.object({
  receipt: matchReceiptSchema,
  profiles: z.array(z.object({
    uid: z.string().min(1).max(128),
    displayName: z.string().min(1).max(80),
  })).min(1).max(4),
});
export type QueuedResult = z.infer<typeof queuedResultSchema>;

function integrityPayload(receipt: MatchReceipt): string {
  return JSON.stringify({
    version: receipt.version,
    receiptId: receipt.receiptId,
    matchId: receipt.matchId,
    mode: receipt.mode,
    context: receipt.context,
    status: receipt.status,
    participants: receipt.participants,
    winnerUid: receipt.winnerUid,
    durationMs: receipt.durationMs,
    rewards: receipt.rewards,
    completedAt: receipt.completedAt,
  });
}

export async function sealReceipt(
  secret: string,
  unsigned: Omit<MatchReceipt, 'integrityHash'>,
): Promise<MatchReceipt> {
  const draft = { ...unsigned, integrityHash: 'pending' } as MatchReceipt;
  return matchReceiptSchema.parse({
    ...unsigned,
    integrityHash: await hmacSha256Hex(secret, integrityPayload(draft)),
  });
}

export async function verifyReceiptIntegrity(
  secret: string,
  receipt: MatchReceipt,
): Promise<boolean> {
  const expected = await hmacSha256Hex(secret, integrityPayload(receipt));
  if (expected.length !== receipt.integrityHash.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ receipt.integrityHash.charCodeAt(index);
  }
  return difference === 0;
}

export function xpSourceForMode(mode: OnlineMode): 'chess_match' | 'coop_breach' {
  return mode === 'coop_breach' ? 'coop_breach' : 'chess_match';
}

export function participantReward(
  matchId: string,
  uid: string,
  xpAmount: number,
  cosmeticIds: readonly string[] = [],
): MatchReceipt['rewards'][number] {
  return {
    uid,
    rewardKey: `network:${matchId}:${uid}:v1`,
    xpAmount,
    cosmeticIds: [...cosmeticIds],
  };
}
