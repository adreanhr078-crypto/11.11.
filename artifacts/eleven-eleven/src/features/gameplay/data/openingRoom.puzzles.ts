import {
  createOpeningRoomNarrativeFlags,
  type OpeningRoomPuzzleStage,
} from '../systems/puzzleSystem';

export const OPENING_ROOM_PUZZLE_ID = 'opening-room-first-signal';
export const OPENING_ROOM_MEMORY_ID = 'memory_opening_room_handprint';

export interface OpeningRoomPuzzleDefinition {
  readonly id: string;
  readonly memoryId: string;
  readonly stages: readonly OpeningRoomPuzzleStage[];
  readonly requiredClues: readonly [
    'openingClockInspected',
    'openingPhotoInspected',
  ];
}

export const OPENING_ROOM_PUZZLE: OpeningRoomPuzzleDefinition = {
  id: OPENING_ROOM_PUZZLE_ID,
  memoryId: OPENING_ROOM_MEMORY_ID,
  stages: [
    'locked',
    'clueFound',
    'memoryRecovered',
    'solved',
    'exitUnlocked',
  ],
  requiredClues: [
    'openingClockInspected',
    'openingPhotoInspected',
  ],
};

export const INITIAL_OPENING_ROOM_NARRATIVE_FLAGS =
  createOpeningRoomNarrativeFlags();
