export const AWAKENING_WARD_FLAG_IDS = [
  'clock_1111_inspected',
  'power_restored',
  'monitor_activated',
  'mirror_clue_discovered',
  'hidden_drawer_opened',
  'awakening_exit_unlocked',
] as const;

export type AwakeningWardFlag =
  typeof AWAKENING_WARD_FLAG_IDS[number];

export const WARD_ITEM_IDS = [
  'keycard_a07',
  'medical_patch',
  'battery',
] as const;

export type WardItemId = typeof WARD_ITEM_IDS[number];

export const WARD_CLUE_IDS = [
  'clock_freeze_observation',
  'monitor_reflection_directive',
  'mirror_symbol_sequence',
] as const;

export type WardClueId = typeof WARD_CLUE_IDS[number];

export interface WardPoint {
  x: number;
  y: number;
}

export interface WardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WardInventoryEntry {
  id: WardItemId;
  quantity: number;
}

export interface AwakeningWardSaveState {
  schemaVersion: 1;
  currentZoneId: 'awakening-ward-a01';
  playerPosition: WardPoint;
  lastCheckpointId: 'capsule' | 'power' | 'corridor' | 'exit';
  puzzleFlags: Record<AwakeningWardFlag, boolean>;
  inventory: WardInventoryEntry[];
  collectedPickupIds: Array<'medical_patch' | 'battery'>;
  collectedClues: WardClueId[];
  health: number;
  stamina: number;
  awakeningWardCompleted: boolean;
  updatedAt: string | null;
}

export type WardPuzzleId =
  | 'ward_power_circuit'
  | 'ward_monitor_tuning'
  | 'ward_mirror_observation'
  | 'ward_drawer_keypad';

export type WardInteractionId =
  | 'awakening_clock'
  | 'awakening_power_panel'
  | 'awakening_monitor'
  | 'awakening_mirror'
  | 'awakening_hidden_drawer'
  | 'awakening_keycard'
  | 'awakening_exit_reader'
  | 'awakening_medical_patch'
  | 'awakening_battery';

export type WardInteractionType =
  | 'inspect'
  | 'puzzle'
  | 'collect'
  | 'unlock';

export interface WardInteractionDefinition {
  id: WardInteractionId;
  type: WardInteractionType;
  position: WardPoint;
  interactionRadius: number;
  prompt: string;
  completedPrompt: string;
  requiredFlags: AwakeningWardFlag[];
  grantedFlags: AwakeningWardFlag[];
  requiredItem?: WardItemId;
  grantsItem?: WardItemId;
  puzzleId?: WardPuzzleId;
  repeatable: boolean;
  feedback: 'clock' | 'electric' | 'screen' | 'glass' | 'drawer' | 'item' | 'door';
}

export type WardObjectKind =
  | 'capsule'
  | 'medical-console'
  | 'side-table'
  | 'power-panel'
  | 'monitor-bank'
  | 'chair'
  | 'mirror'
  | 'storage'
  | 'crate'
  | 'exit-door'
  | 'reader'
  | 'cable';

export interface WardSceneObject {
  id: string;
  kind: WardObjectKind;
  bounds: WardRect;
  height: number;
  collidable: boolean;
  label?: string;
}

export interface WardPuzzleDefinition {
  id: WardPuzzleId;
  zoneId: AwakeningWardSaveState['currentZoneId'];
  interactionId: WardInteractionId;
  requiredFlags: AwakeningWardFlag[];
  grantedFlags: AwakeningWardFlag[];
  presentation: 'circuit' | 'monitor' | 'mirror' | 'keypad';
  origin: 'room' | 'legacy-adapter';
  legacySaveId?: string;
}
