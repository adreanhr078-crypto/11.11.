import {
  canUnlockOpeningDoor,
  isOpeningDoorUnlocked,
  type OpeningRoomNarrativeFlags,
  type OpeningRoomPuzzleEvent,
} from '../systems/puzzleSystem';
import type {
  InteractionDefinition,
  NarrativeEffect,
} from '../types/gameplay.types';
import {
  OPENING_ROOM_MEMORY_ID,
  OPENING_ROOM_PUZZLE_ID,
} from './openingRoom.puzzles';

export interface OpeningRoomInteractionContext {
  readonly flags: Readonly<Partial<OpeningRoomNarrativeFlags>>;
}

export interface OpeningRoomEventEffect extends NarrativeEffect {
  readonly type: 'openingRoomEvent';
  readonly event: OpeningRoomPuzzleEvent;
}

export type OpeningRoomInteraction =
  InteractionDefinition<
    OpeningRoomInteractionContext,
    OpeningRoomEventEffect
  >;

function eventEffect(
  event: OpeningRoomPuzzleEvent,
): OpeningRoomEventEffect {
  return {
    type: 'openingRoomEvent',
    event,
  };
}

const CLOCK_INSPECTED_EFFECT = eventEffect({
  type: 'clockInspected',
});
const PHOTO_INSPECTED_EFFECT = eventEffect({
  type: 'photoInspected',
});

function clueEffects(
  ownEffect: OpeningRoomEventEffect,
  otherClueFound: boolean,
  memoryAlreadyRecovered: boolean,
): readonly OpeningRoomEventEffect[] {
  if (!otherClueFound || memoryAlreadyRecovered) return [ownEffect];

  return [
    ownEffect,
    eventEffect({
      type: 'memoryRecovered',
      memoryId: OPENING_ROOM_MEMORY_ID,
    }),
    eventEffect({ type: 'puzzleSolved' }),
  ];
}

export const OPENING_ROOM_INTERACTIONS:
readonly OpeningRoomInteraction[] = [
  {
    id: 'opening-clock',
    type: 'inspect',
    position: { x: 0.65, y: 1.55, z: -3.28 },
    interactionDistance: 1.45,
    prompt: 'E — افحص الساعة',
    enabledCondition: ({ flags }) => (
      flags.openingClockInspected !== true
    ),
    onInteract: ({ flags }) => ({
      outcome: flags.openingPhotoInspected
        ? 'memory'
        : 'narration',
      message: (
        'عقارب الساعة ساكنة عند 11:11. '
        + 'الصمت حولها أثقل من أن يكون عاديًا.'
      ),
      effects: clueEffects(
        CLOCK_INSPECTED_EFFECT,
        flags.openingPhotoInspected === true,
        flags.openingMemoryRecovered === true,
      ),
    }),
    puzzleId: OPENING_ROOM_PUZZLE_ID,
    narrativeEffects: [CLOCK_INSPECTED_EFFECT],
  },
  {
    id: 'opening-photo',
    type: 'inspect',
    position: { x: 2.55, y: 1.12, z: -1.46 },
    interactionDistance: 1.5,
    prompt: 'E — افحص الصورة الممزقة',
    enabledCondition: ({ flags }) => (
      flags.openingPhotoInspected !== true
    ),
    onInteract: ({ flags }) => ({
      outcome: flags.openingClockInspected
        ? 'memory'
        : 'narration',
      message: (
        'صورة ممزقة لشخص لا يظهر منه سوى ظل باهت. '
        + 'على ظهرها: «عندما تشعر بالخوف، عُدّ حتى أحد عشر.» '
        + 'وفوق الحافة الممزقة خُطّت جملة أخرى: '
        + '«لا أتذكر الوجه… فقط أنني لم أكن وحدي.»'
      ),
      effects: clueEffects(
        PHOTO_INSPECTED_EFFECT,
        flags.openingClockInspected === true,
        flags.openingMemoryRecovered === true,
      ),
    }),
    memoryId: OPENING_ROOM_MEMORY_ID,
    puzzleId: OPENING_ROOM_PUZZLE_ID,
    narrativeEffects: [PHOTO_INSPECTED_EFFECT],
  },
  {
    id: 'opening-door',
    type: 'door',
    position: { x: -2.3, y: 1.05, z: -3.32 },
    interactionDistance: 1.4,
    prompt: 'E — افحص الباب',
    enabledCondition: ({ flags }) => (
      flags.openingRoomCompleted !== true
    ),
    onInteract: ({ flags }) => {
      if (isOpeningDoorUnlocked(flags)) {
        return {
          outcome: 'unlocked',
          message: 'الباب مفتوح. يمتد خلفه ممر بلا ضوء.',
          effects: [],
        };
      }

      if (!canUnlockOpeningDoor(flags)) {
        return {
          outcome: 'locked',
          message: (
            'الباب مقفل. هناك شيء في الغرفة لم يُستعد بعد.'
          ),
          effects: [],
        };
      }

      return {
        outcome: 'unlocked',
        message: 'استجاب القفل أخيرًا، وانفتح الباب ببطء.',
        effects: [eventEffect({ type: 'doorUnlocked' })],
      };
    },
    puzzleId: OPENING_ROOM_PUZZLE_ID,
  },
];

export const OPENING_CLOCK_INTERACTION =
  OPENING_ROOM_INTERACTIONS[0];
export const OPENING_PHOTO_INTERACTION =
  OPENING_ROOM_INTERACTIONS[1];
export const OPENING_DOOR_INTERACTION =
  OPENING_ROOM_INTERACTIONS[2];
