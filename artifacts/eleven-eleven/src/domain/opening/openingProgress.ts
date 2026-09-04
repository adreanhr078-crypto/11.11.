import {
  FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER,
} from '../../content/manhwa/finalManhwa';

export const OPENING_COVER_PUZZLE_ID = 'opening_cover_reconstruction_v1' as const;
export const OPENING_ROOM_ID = 'opening_room_echo_lab_v1' as const;
export const OPENING_MANHWA_PACKET_ID = 'opening_room_pages_01_09_v1' as const;

/**
 * The opening packet is deliberately explicit. A room receipt can only ever
 * unlock pages that have been reviewed as part of that room's story beat.
 */
export const OPENING_MANHWA_PACKET_PAGE_IDS = Object.freeze(
  Array.from({ length: 9 }, (_, index) => (
    FINAL_MANHWA_PAGE_BY_GLOBAL_NUMBER[index + 1]!.id
  )),
);

export const OPENING_ROOM_EVENT_SEQUENCE = Object.freeze([
  'room_entered',
  'clock_inspected',
  'photo_inspected',
  'memory_recovered',
  'puzzle_solved',
  'door_unlocked',
  'memory_scene_completed',
] as const);

export type OpeningRoomEventId = typeof OPENING_ROOM_EVENT_SEQUENCE[number];

export interface StoryUnlockState {
  openingCoverPuzzleCompleted: boolean;
  openingRoomCompleted: boolean;
  manhwaPacketIds: readonly string[];
  chessHobbyUnlocked: boolean;
}

export function createInitialStoryUnlockState(): StoryUnlockState {
  return {
    openingCoverPuzzleCompleted: false,
    openingRoomCompleted: false,
    manhwaPacketIds: [],
    chessHobbyUnlocked: false,
  };
}

export function normalizeStoryUnlockState(
  value: unknown,
): StoryUnlockState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return createInitialStoryUnlockState();
  }
  const source = value as Record<string, unknown>;
  const rawPacketIds = Array.isArray(source.manhwaPacketIds)
    ? source.manhwaPacketIds
    : [];
  const packetIds = [...new Set(
    rawPacketIds
      .filter((packetId): packetId is string => typeof packetId === 'string')
      .map((packetId) => packetId.trim())
      .filter((packetId) => packetId === OPENING_MANHWA_PACKET_ID),
  )];
  return {
    openingCoverPuzzleCompleted: source.openingCoverPuzzleCompleted === true,
    openingRoomCompleted: source.openingRoomCompleted === true,
    manhwaPacketIds: packetIds,
    chessHobbyUnlocked: source.chessHobbyUnlocked === true,
  };
}

export function isOpeningRoomEventId(value: unknown): value is OpeningRoomEventId {
  return typeof value === 'string'
    && (OPENING_ROOM_EVENT_SEQUENCE as readonly string[]).includes(value);
}
