/**
 * Live snapshots can refresh after a draft write or hint receipt.  The active
 * board must only hydrate when the server has moved the player to a different
 * Daily window or Weekly stage; otherwise a late snapshot would erase a touch
 * gesture that is still being persisted.
 */
export function shouldRestoreLiveChallengeDraft(
  restoredChallengeKey: string | null,
  activeChallengeKey: string,
): boolean {
  return restoredChallengeKey !== activeChallengeKey;
}

/**
 * The API uses `undefined` to mean an empty, intentionally cleared draft.
 * Keep every non-empty answer byte-for-byte so a player never loses partial
 * work to presentation normalization.
 */
export function toPersistedLiveChallengeDraft(answer: string): string | undefined {
  return answer || undefined;
}
