export const PARTY_RECONNECT_GRACE_MS = 45_000;

const PARTY_ROOM_ID_PATTERN = /^party-([A-Z2-9]{8,16})$/i;

export function normalizePartyRoomId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = PARTY_ROOM_ID_PATTERN.exec(value.trim());
  return match ? `party-${match[1]!.toUpperCase()}` : null;
}

export function earliestPartyCleanupAlarm(
  existingAlarm: number | null,
  requestedAt: number,
): number {
  return existingAlarm === null ? requestedAt : Math.min(existingAlarm, requestedAt);
}
