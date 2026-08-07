import type {
  WardPuzzleDefinition,
  WardPuzzleId,
} from '../domain/awakeningWardTypes';

const authoredRoomPuzzles: WardPuzzleDefinition[] = [
  {
    id: 'ward_power_circuit',
    zoneId: 'awakening-ward-a01',
    interactionId: 'awakening_power_panel',
    requiredFlags: ['clock_1111_inspected'],
    grantedFlags: ['power_restored'],
    presentation: 'circuit',
    origin: 'room',
  },
  {
    id: 'ward_monitor_tuning',
    zoneId: 'awakening-ward-a01',
    interactionId: 'awakening_monitor',
    requiredFlags: ['power_restored'],
    grantedFlags: ['monitor_activated'],
    presentation: 'monitor',
    origin: 'room',
  },
  {
    id: 'ward_mirror_observation',
    zoneId: 'awakening-ward-a01',
    interactionId: 'awakening_mirror',
    requiredFlags: ['monitor_activated'],
    grantedFlags: ['mirror_clue_discovered'],
    presentation: 'mirror',
    origin: 'room',
  },
  {
    id: 'ward_drawer_keypad',
    zoneId: 'awakening-ward-a01',
    interactionId: 'awakening_hidden_drawer',
    requiredFlags: ['mirror_clue_discovered'],
    grantedFlags: ['hidden_drawer_opened'],
    presentation: 'keypad',
    origin: 'room',
  },
];

const registry = new Map<WardPuzzleId, WardPuzzleDefinition>(
  authoredRoomPuzzles.map((puzzle) => [puzzle.id, puzzle]),
);

export const AWAKENING_WARD_PUZZLE_REGISTRY = Object.freeze(
  Object.fromEntries(registry),
) as Readonly<Record<WardPuzzleId, WardPuzzleDefinition>>;

export function getRoomPuzzle(
  puzzleId: WardPuzzleId,
): WardPuzzleDefinition {
  return AWAKENING_WARD_PUZZLE_REGISTRY[puzzleId];
}

/**
 * Future legacy adapters can be registered without changing the 20 authored
 * puzzle records or their save IDs. No legacy puzzle is migrated in this slice.
 */
export function createLegacyPuzzleAdapter(
  definition: Omit<WardPuzzleDefinition, 'origin'> & {
    legacySaveId: string;
  },
): WardPuzzleDefinition {
  return {
    ...definition,
    origin: 'legacy-adapter',
  };
}
