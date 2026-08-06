import type {
  WardInteractionDefinition,
  WardPoint,
  WardRect,
  WardSceneObject,
} from '../domain/awakeningWardTypes';

export const AWAKENING_WARD_ZONE_ID = 'awakening-ward-a01' as const;

export const AWAKENING_WARD_BOUNDS: WardRect = {
  x: 1,
  y: 1,
  width: 32,
  height: 20,
};

export const AWAKENING_WARD_WALKABLE_ZONES: readonly WardRect[] = [
  { x: 1.5, y: 1.5, width: 19.5, height: 19 },
  { x: 19.5, y: 7.5, width: 13, height: 7 },
  { x: 28, y: 5.5, width: 4.5, height: 11 },
];

export const AWAKENING_WARD_SPAWN: WardPoint = {
  x: 7.2,
  y: 14.8,
};

export const AWAKENING_WARD_CHECKPOINTS = {
  capsule: AWAKENING_WARD_SPAWN,
  power: { x: 9.5, y: 6.4 },
  corridor: { x: 22.2, y: 11 },
  exit: { x: 29.2, y: 11 },
} as const satisfies Record<string, WardPoint>;

export const AWAKENING_WARD_EXIT_APPROACH: WardPoint = {
  x: 30.4,
  y: 11,
};

export const EXIT_CORRIDOR_CLEARANCE: WardRect = {
  x: 20.8,
  y: 8.2,
  width: 9.7,
  height: 5.6,
};

export const AWAKENING_WARD_OBJECTS: readonly WardSceneObject[] = [
  {
    id: 'awakening-capsule',
    kind: 'capsule',
    bounds: { x: 8.2, y: 9.2, width: 5.2, height: 3.2 },
    height: 2.2,
    collidable: true,
    label: 'A-01',
  },
  {
    id: 'medical-console-west',
    kind: 'medical-console',
    bounds: { x: 2.4, y: 12.5, width: 2.4, height: 3 },
    height: 2.5,
    collidable: true,
  },
  {
    id: 'clock-side-table',
    kind: 'side-table',
    bounds: { x: 2.7, y: 6, width: 3.1, height: 1.5 },
    height: 1.2,
    collidable: true,
  },
  {
    id: 'power-section-panel',
    kind: 'power-panel',
    bounds: { x: 7.2, y: 2, width: 3.3, height: 1.8 },
    height: 3.1,
    collidable: true,
  },
  {
    id: 'monitoring-main-bank',
    kind: 'monitor-bank',
    bounds: { x: 12.4, y: 2, width: 6.2, height: 2.1 },
    height: 3.3,
    collidable: true,
  },
  {
    id: 'monitor-chair',
    kind: 'chair',
    bounds: { x: 13.2, y: 6.2, width: 1.5, height: 1.5 },
    height: 1.4,
    collidable: true,
  },
  {
    id: 'wall-mirror',
    kind: 'mirror',
    bounds: { x: 20.1, y: 14.9, width: 0.7, height: 2.1 },
    height: 3.4,
    collidable: false,
  },
  {
    id: 'mirror-storage',
    kind: 'storage',
    bounds: { x: 17.4, y: 15.7, width: 2.7, height: 2.3 },
    height: 1.8,
    collidable: true,
  },
  {
    id: 'corridor-crate-north',
    kind: 'crate',
    bounds: { x: 23.7, y: 7.5, width: 1.7, height: 0.6 },
    height: 1.4,
    collidable: true,
  },
  {
    id: 'exit-door-a07',
    kind: 'exit-door',
    bounds: { x: 31.6, y: 9.3, width: 0.8, height: 3.4 },
    height: 3.8,
    collidable: true,
    label: 'A-07',
  },
  {
    id: 'exit-reader-a07',
    kind: 'reader',
    bounds: { x: 30.7, y: 13.1, width: 0.7, height: 0.7 },
    height: 1.4,
    collidable: false,
  },
  {
    id: 'capsule-cable-run',
    kind: 'cable',
    bounds: { x: 12.5, y: 12.1, width: 4.8, height: 0.35 },
    height: 0.15,
    collidable: false,
  },
] as const;

export const AWAKENING_WARD_OBSTACLES = AWAKENING_WARD_OBJECTS
  .filter((object) => object.collidable)
  .map((object) => object.bounds);

export const AWAKENING_WARD_INTERACTIONS: readonly WardInteractionDefinition[] = [
  {
    id: 'awakening_clock',
    type: 'inspect',
    position: { x: 4.2, y: 5.1 },
    interactionRadius: 2.2,
    prompt: 'افحص الساعة المتوقفة',
    completedPrompt: 'الساعة ما زالت متوقفة عند 11:11',
    requiredFlags: [],
    grantedFlags: ['clock_1111_inspected'],
    repeatable: true,
    feedback: 'clock',
  },
  {
    id: 'awakening_power_panel',
    type: 'puzzle',
    position: { x: 8.8, y: 4.7 },
    interactionRadius: 2.35,
    prompt: 'أعد توجيه الطاقة',
    completedPrompt: 'الطاقة مستقرة',
    requiredFlags: ['clock_1111_inspected'],
    grantedFlags: ['power_restored'],
    puzzleId: 'ward_power_circuit',
    repeatable: false,
    feedback: 'electric',
  },
  {
    id: 'awakening_monitor',
    type: 'puzzle',
    position: { x: 15.5, y: 4.9 },
    interactionRadius: 2.4,
    prompt: 'فعّل محطة المراقبة',
    completedPrompt: 'إشارة الانعكاس محفوظة',
    requiredFlags: ['power_restored'],
    grantedFlags: ['monitor_activated'],
    puzzleId: 'ward_monitor_tuning',
    repeatable: true,
    feedback: 'screen',
  },
  {
    id: 'awakening_mirror',
    type: 'puzzle',
    position: { x: 19.5, y: 15.1 },
    interactionRadius: 2.25,
    prompt: 'راقب الانعكاس',
    completedPrompt: 'راجع ترتيب الرموز في سجل الأدلة',
    requiredFlags: ['monitor_activated'],
    grantedFlags: ['mirror_clue_discovered'],
    puzzleId: 'ward_mirror_observation',
    repeatable: true,
    feedback: 'glass',
  },
  {
    id: 'awakening_hidden_drawer',
    type: 'puzzle',
    position: { x: 18.6, y: 15.1 },
    interactionRadius: 2.2,
    prompt: 'أدخل تسلسل الرموز',
    completedPrompt: 'الدرج مفتوح',
    requiredFlags: ['mirror_clue_discovered'],
    grantedFlags: ['hidden_drawer_opened'],
    puzzleId: 'ward_drawer_keypad',
    repeatable: false,
    feedback: 'drawer',
  },
  {
    id: 'awakening_keycard',
    type: 'collect',
    position: { x: 19.1, y: 15.25 },
    interactionRadius: 2.15,
    prompt: 'خذ بطاقة A-07',
    completedPrompt: 'البطاقة محفوظة في الحقيبة',
    requiredFlags: ['hidden_drawer_opened'],
    grantedFlags: [],
    grantsItem: 'keycard_a07',
    repeatable: false,
    feedback: 'item',
  },
  {
    id: 'awakening_exit_reader',
    type: 'unlock',
    position: { x: 30.4, y: 12.3 },
    interactionRadius: 2.3,
    prompt: 'استخدم بطاقة A-07',
    completedPrompt: 'تم فتح الممر التجريبي',
    requiredFlags: ['hidden_drawer_opened'],
    grantedFlags: ['awakening_exit_unlocked'],
    requiredItem: 'keycard_a07',
    repeatable: false,
    feedback: 'door',
  },
  {
    id: 'awakening_medical_patch',
    type: 'collect',
    position: { x: 5.35, y: 13.4 },
    interactionRadius: 1.9,
    prompt: 'خذ الرقعة الطبية',
    completedPrompt: 'تم جمع الرقعة الطبية',
    requiredFlags: [],
    grantedFlags: [],
    grantsItem: 'medical_patch',
    repeatable: false,
    feedback: 'item',
  },
  {
    id: 'awakening_battery',
    type: 'collect',
    position: { x: 6.2, y: 4.55 },
    interactionRadius: 1.9,
    prompt: 'خذ البطارية التجريبية',
    completedPrompt: 'تم جمع البطارية',
    requiredFlags: [],
    grantedFlags: [],
    grantsItem: 'battery',
    repeatable: false,
    feedback: 'item',
  },
] as const;

export const AWAKENING_WARD_INTERACTION_BY_ID = Object.freeze(
  Object.fromEntries(
    AWAKENING_WARD_INTERACTIONS.map((interaction) => [
      interaction.id,
      interaction,
    ]),
  ),
);
