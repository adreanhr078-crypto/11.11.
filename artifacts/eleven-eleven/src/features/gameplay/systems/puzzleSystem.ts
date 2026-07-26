import type { NarrativeEffect } from '../types/gameplay.types';

export type OpeningRoomPuzzleStage =
  | 'locked'
  | 'clueFound'
  | 'memoryRecovered'
  | 'solved'
  | 'exitUnlocked';

export interface OpeningRoomNarrativeFlags {
  readonly openingRoomEntered: boolean;
  readonly openingClockInspected: boolean;
  readonly openingPhotoInspected: boolean;
  readonly openingMemoryRecovered: boolean;
  readonly openingPuzzleSolved: boolean;
  readonly openingDoorUnlocked: boolean;
  readonly openingRoomCompleted: boolean;
}

export type OpeningRoomPuzzleEvent =
  | { readonly type: 'roomEntered' }
  | { readonly type: 'clockInspected' }
  | { readonly type: 'photoInspected' }
  | {
    readonly type: 'memoryRecovered';
    readonly memoryId: string;
  }
  | { readonly type: 'puzzleSolved' }
  | { readonly type: 'doorUnlocked' }
  | { readonly type: 'roomCompleted' };

export interface GrantOpeningRoomMemoryEffect extends NarrativeEffect {
  readonly type: 'grantMemory';
  readonly memoryId: string;
}

export type OpeningRoomPuzzleEffect = GrantOpeningRoomMemoryEffect;

export interface OpeningRoomPuzzleState {
  readonly stage: OpeningRoomPuzzleStage;
  readonly flags: OpeningRoomNarrativeFlags;
  readonly canUnlockDoor: boolean;
}

export interface OpeningRoomPuzzleTransition {
  readonly previousState: OpeningRoomPuzzleState;
  readonly state: OpeningRoomPuzzleState;
  readonly effects: readonly OpeningRoomPuzzleEffect[];
  readonly changed: boolean;
}

const DEFAULT_OPENING_ROOM_FLAGS: OpeningRoomNarrativeFlags = {
  openingRoomEntered: false,
  openingClockInspected: false,
  openingPhotoInspected: false,
  openingMemoryRecovered: false,
  openingPuzzleSolved: false,
  openingDoorUnlocked: false,
  openingRoomCompleted: false,
};

export function createOpeningRoomNarrativeFlags(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>> = {},
): OpeningRoomNarrativeFlags {
  return {
    ...DEFAULT_OPENING_ROOM_FLAGS,
    ...savedFlags,
  };
}

function hasSolvedPrerequisites(
  flags: OpeningRoomNarrativeFlags,
): boolean {
  return flags.openingClockInspected
    && flags.openingPhotoInspected
    && flags.openingMemoryRecovered
    && flags.openingPuzzleSolved;
}

export function canUnlockOpeningDoor(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>>,
): boolean {
  const flags = createOpeningRoomNarrativeFlags(savedFlags);
  return flags.openingDoorUnlocked || hasSolvedPrerequisites(flags);
}

export function isOpeningDoorUnlocked(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>>,
): boolean {
  return savedFlags.openingDoorUnlocked === true;
}

export function deriveOpeningRoomPuzzleStage(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>>,
): OpeningRoomPuzzleStage {
  const flags = createOpeningRoomNarrativeFlags(savedFlags);

  if (flags.openingDoorUnlocked) return 'exitUnlocked';
  if (flags.openingPuzzleSolved) return 'solved';
  if (flags.openingMemoryRecovered) return 'memoryRecovered';
  if (flags.openingClockInspected || flags.openingPhotoInspected) {
    return 'clueFound';
  }
  return 'locked';
}

export function deriveOpeningRoomPuzzleState(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>>,
): OpeningRoomPuzzleState {
  const flags = createOpeningRoomNarrativeFlags(savedFlags);
  return {
    stage: deriveOpeningRoomPuzzleStage(flags),
    flags,
    canUnlockDoor: canUnlockOpeningDoor(flags),
  };
}

export function transitionOpeningRoomPuzzle(
  savedFlags: Readonly<Partial<OpeningRoomNarrativeFlags>>,
  event: OpeningRoomPuzzleEvent,
): OpeningRoomPuzzleTransition {
  const previousState = deriveOpeningRoomPuzzleState(savedFlags);
  const current = previousState.flags;
  let next = current;
  let changed = false;
  let effects: readonly OpeningRoomPuzzleEffect[] = [];

  switch (event.type) {
    case 'roomEntered':
      if (!current.openingRoomEntered) {
        next = { ...current, openingRoomEntered: true };
        changed = true;
      }
      break;

    case 'clockInspected':
      if (!current.openingClockInspected) {
        next = { ...current, openingClockInspected: true };
        changed = true;
      }
      break;

    case 'photoInspected':
      if (!current.openingPhotoInspected) {
        next = { ...current, openingPhotoInspected: true };
        changed = true;
      }
      break;

    case 'memoryRecovered':
      if (
        current.openingClockInspected
        && current.openingPhotoInspected
        && !current.openingMemoryRecovered
      ) {
        next = { ...current, openingMemoryRecovered: true };
        effects = [{
          type: 'grantMemory',
          memoryId: event.memoryId,
        }];
        changed = true;
      }
      break;

    case 'puzzleSolved':
      if (
        current.openingMemoryRecovered
        && !current.openingPuzzleSolved
      ) {
        next = { ...current, openingPuzzleSolved: true };
        changed = true;
      }
      break;

    case 'doorUnlocked':
      if (
        hasSolvedPrerequisites(current)
        && !current.openingDoorUnlocked
      ) {
        next = { ...current, openingDoorUnlocked: true };
        changed = true;
      }
      break;

    case 'roomCompleted':
      if (
        current.openingDoorUnlocked
        && !current.openingRoomCompleted
      ) {
        next = { ...current, openingRoomCompleted: true };
        changed = true;
      }
      break;
  }

  return {
    previousState,
    state: deriveOpeningRoomPuzzleState(next),
    effects,
    changed,
  };
}
