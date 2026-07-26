import { useCallback, useMemo } from 'react';
import { useGameStore } from '../../../stores/gameStore';
import {
  OPENING_ROOM_INTERACTIONS,
  type OpeningRoomInteraction,
} from '../data/openingRoom.interactions';
import {
  deriveOpeningRoomPuzzleState,
  transitionOpeningRoomPuzzle,
  type OpeningRoomNarrativeFlags,
  type OpeningRoomPuzzleEvent,
} from '../systems/puzzleSystem';
import type { InteractionResult } from '../types/gameplay.types';

const PERSISTED_FLAG_KEYS = {
  openingRoomEntered: 'opening_room_entered',
  openingClockInspected: 'opening_clock_inspected',
  openingPhotoInspected: 'opening_photo_inspected',
  openingMemoryRecovered: 'opening_room_memory_recovered',
  openingPuzzleSolved: 'opening_puzzle_solved',
  openingDoorUnlocked: 'opening_door_unlocked',
  openingRoomCompleted: 'opening_room_completed',
} as const satisfies Record<keyof OpeningRoomNarrativeFlags, string>;

export const OPENING_ROOM_CONTROLS_SEEN_FLAG =
  'opening_room_controls_seen';
export const OPENING_ROOM_CINEMATIC_SEEN_FLAG =
  'opening_room_cinematic_seen';

function readOpeningRoomFlags(
  activeFlags: Readonly<Record<string, boolean>>,
): OpeningRoomNarrativeFlags {
  return {
    openingRoomEntered: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingRoomEntered],
    ),
    openingClockInspected: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingClockInspected],
    ),
    openingPhotoInspected: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingPhotoInspected],
    ),
    openingMemoryRecovered: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingMemoryRecovered],
    ),
    openingPuzzleSolved: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingPuzzleSolved],
    ),
    openingDoorUnlocked: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingDoorUnlocked],
    ),
    openingRoomCompleted: Boolean(
      activeFlags[PERSISTED_FLAG_KEYS.openingRoomCompleted],
    ),
  };
}

export interface OpeningRoomInteractionExecution {
  interaction: OpeningRoomInteraction;
  result: InteractionResult;
  memoryGranted: boolean;
}

export function useOpeningRoomProgress() {
  const activeFlags = useGameStore(
    (state) => state.narrative.activeFlags,
  );
  const flags = useMemo(
    () => readOpeningRoomFlags(activeFlags),
    [activeFlags],
  );
  const puzzle = useMemo(
    () => deriveOpeningRoomPuzzleState(flags),
    [flags],
  );

  const applyEvent = useCallback((event: OpeningRoomPuzzleEvent) => {
    const game = useGameStore.getState();
    const currentFlags = readOpeningRoomFlags(
      game.narrative.activeFlags,
    );
    const transition = transitionOpeningRoomPuzzle(
      currentFlags,
      event,
    );
    if (!transition.changed) return transition;

    for (
      const key of Object.keys(PERSISTED_FLAG_KEYS) as Array<
        keyof OpeningRoomNarrativeFlags
      >
    ) {
      if (transition.state.flags[key] === currentFlags[key]) continue;
      game.actions.setNarrativeFlag(
        PERSISTED_FLAG_KEYS[key],
        transition.state.flags[key],
      );
    }

    if (transition.effects.some((effect) => effect.type === 'grantMemory')) {
      useGameStore.getState().actions.unlockEligibleMemories();
    }

    return transition;
  }, []);

  const applyEvents = useCallback((
    events: readonly OpeningRoomPuzzleEvent[],
  ) => {
    let memoryGranted = false;
    for (const event of events) {
      const transition = applyEvent(event);
      if (transition.effects.some(
        (effect) => effect.type === 'grantMemory',
      )) {
        memoryGranted = true;
      }
    }
    return memoryGranted;
  }, [applyEvent]);

  const enterRoom = useCallback(() => {
    applyEvent({ type: 'roomEntered' });
  }, [applyEvent]);

  const executeInteraction = useCallback((
    interactionId: string,
  ): OpeningRoomInteractionExecution | null => {
    const interaction = OPENING_ROOM_INTERACTIONS.find(
      ({ id }) => id === interactionId,
    );
    if (!interaction) return null;

    const game = useGameStore.getState();
    const context = {
      flags: readOpeningRoomFlags(game.narrative.activeFlags),
    };
    if (!interaction.enabledCondition(context)) return null;

    const result = interaction.onInteract(context);
    const events = result.effects.flatMap((effect) => (
      effect.type === 'openingRoomEvent' ? [effect.event] : []
    ));
    const memoryGranted = applyEvents(events);

    if (interaction.type === 'door' && result.outcome === 'unlocked') {
      const afterUnlock = readOpeningRoomFlags(
        useGameStore.getState().narrative.activeFlags,
      );
      if (afterUnlock.openingDoorUnlocked) {
        applyEvent({ type: 'roomCompleted' });
        const latest = useGameStore.getState();
        if (!latest.narrative.latestDecisions['opening-room-exit']) {
          latest.actions.recordNarrativeDecision(
            'opening-room-exit',
            'opened',
            'system',
          );
        }
      }
    }

    return {
      interaction,
      result,
      memoryGranted,
    };
  }, [applyEvent, applyEvents]);

  const markControlsSeen = useCallback(() => {
    useGameStore.getState().actions.setNarrativeFlag(
      OPENING_ROOM_CONTROLS_SEEN_FLAG,
      true,
    );
  }, []);

  const markCinematicSeen = useCallback(() => {
    useGameStore.getState().actions.setNarrativeFlag(
      OPENING_ROOM_CINEMATIC_SEEN_FLAG,
      true,
    );
  }, []);

  return {
    flags,
    puzzle,
    enterRoom,
    executeInteraction,
    markControlsSeen,
    markCinematicSeen,
    controlsSeen: Boolean(activeFlags[OPENING_ROOM_CONTROLS_SEEN_FLAG]),
    cinematicSeen: Boolean(
      activeFlags[OPENING_ROOM_CINEMATIC_SEEN_FLAG],
    ),
  };
}
