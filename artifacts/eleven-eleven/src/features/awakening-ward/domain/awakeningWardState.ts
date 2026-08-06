import {
  AWAKENING_WARD_CHECKPOINTS,
  AWAKENING_WARD_SPAWN,
} from '../data/awakeningWardMap';
import {
  AWAKENING_WARD_FLAG_IDS,
  WARD_CLUE_IDS,
  WARD_ITEM_IDS,
  type AwakeningWardFlag,
  type AwakeningWardSaveState,
  type WardClueId,
  type WardInteractionDefinition,
  type WardInventoryEntry,
  type WardItemId,
  type WardPoint,
} from './awakeningWardTypes';
import { isWardPositionWalkable } from './wardNavigation';

export const AWAKENING_WARD_INVENTORY_CAPACITY = 6;

export const WARD_ITEM_CATALOG: Readonly<Record<WardItemId, {
  name: string;
  description: string;
  essential: boolean;
  consumable: boolean;
  maxStack: number;
}>> = Object.freeze({
  keycard_a07: {
    name: 'Keycard A-07',
    description: 'بطاقة وصول مشفرة للباب الإلكتروني A-07.',
    essential: true,
    consumable: false,
    maxStack: 1,
  },
  medical_patch: {
    name: 'Medical Patch',
    description: 'رقعة طبية تجريبية تستعيد 30 نقطة صحة.',
    essential: false,
    consumable: true,
    maxStack: 2,
  },
  battery: {
    name: 'Prototype Battery',
    description: 'خلية طاقة صغيرة غير مخصصة للاستخدام بعد.',
    essential: false,
    consumable: false,
    maxStack: 1,
  },
});

export const WARD_CLUE_CATALOG: Readonly<Record<WardClueId, {
  title: string;
  body: string;
}>> = Object.freeze({
  clock_freeze_observation: {
    title: '11:11 // قراءة الساعة',
    body: 'الساعة الرقمية تعرض 11:11 ولا تستجيب للطاقة الاحتياطية.',
  },
  monitor_reflection_directive: {
    title: 'قناة مراقبة مشوشة',
    body: 'الإشارة لا تُقرأ مباشرة. سجل النظام يكرر: ابحث في الانعكاس.',
  },
  mirror_symbol_sequence: {
    title: 'تسلسل المرآة',
    body: 'الترتيب المقروء في الانعكاس: مثلث، معين، دائرة، خطان.',
  },
});

const FLAG_PREREQUISITES: Readonly<Record<AwakeningWardFlag, AwakeningWardFlag[]>> = {
  clock_1111_inspected: [],
  power_restored: ['clock_1111_inspected'],
  monitor_activated: ['power_restored'],
  mirror_clue_discovered: ['monitor_activated'],
  hidden_drawer_opened: ['mirror_clue_discovered'],
  awakening_exit_unlocked: ['hidden_drawer_opened'],
};

function createEmptyFlags(): Record<AwakeningWardFlag, boolean> {
  return Object.fromEntries(
    AWAKENING_WARD_FLAG_IDS.map((flag) => [flag, false]),
  ) as Record<AwakeningWardFlag, boolean>;
}

export function createInitialAwakeningWardState(): AwakeningWardSaveState {
  return {
    schemaVersion: 1,
    currentZoneId: 'awakening-ward-a01',
    playerPosition: { ...AWAKENING_WARD_SPAWN },
    lastCheckpointId: 'capsule',
    puzzleFlags: createEmptyFlags(),
    inventory: [],
    collectedPickupIds: [],
    collectedClues: [],
    health: 72,
    stamina: 100,
    awakeningWardCompleted: false,
    updatedAt: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clampMetric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function normalizePosition(
  value: unknown,
  checkpointId: AwakeningWardSaveState['lastCheckpointId'],
): WardPoint {
  const fallback = AWAKENING_WARD_CHECKPOINTS[checkpointId];
  if (!isRecord(value)) return { ...fallback };
  const x = typeof value.x === 'number' ? value.x : fallback.x;
  const y = typeof value.y === 'number' ? value.y : fallback.y;
  const candidate = { x, y };
  return isWardPositionWalkable(candidate)
    ? candidate
    : { ...fallback };
}

function normalizeInventory(value: unknown): WardInventoryEntry[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<WardItemId, number>();
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    if (!WARD_ITEM_IDS.includes(candidate.id as WardItemId)) continue;
    const id = candidate.id as WardItemId;
    const quantity = typeof candidate.quantity === 'number'
      ? Math.max(0, Math.floor(candidate.quantity))
      : 0;
    if (quantity < 1) continue;
    merged.set(
      id,
      Math.min(
        WARD_ITEM_CATALOG[id].maxStack,
        (merged.get(id) ?? 0) + quantity,
      ),
    );
  }
  return [...merged.entries()]
    .slice(0, AWAKENING_WARD_INVENTORY_CAPACITY)
    .map(([id, quantity]) => ({ id, quantity }));
}

export function hasWardItem(
  state: AwakeningWardSaveState,
  itemId: WardItemId,
): boolean {
  return state.inventory.some((entry) => (
    entry.id === itemId && entry.quantity > 0
  ));
}

export function normalizeAwakeningWardState(
  value: unknown,
): AwakeningWardSaveState {
  const initial = createInitialAwakeningWardState();
  if (!isRecord(value)) return initial;

  const rawFlags = isRecord(value.puzzleFlags) ? value.puzzleFlags : {};
  const puzzleFlags = createEmptyFlags();
  for (const flag of AWAKENING_WARD_FLAG_IDS) {
    const prerequisitesMet = FLAG_PREREQUISITES[flag].every(
      (requiredFlag) => puzzleFlags[requiredFlag],
    );
    puzzleFlags[flag] = rawFlags[flag] === true && prerequisitesMet;
  }

  const validCheckpointIds = Object.keys(
    AWAKENING_WARD_CHECKPOINTS,
  ) as AwakeningWardSaveState['lastCheckpointId'][];
  const lastCheckpointId = validCheckpointIds.includes(
    value.lastCheckpointId as AwakeningWardSaveState['lastCheckpointId'],
  )
    ? value.lastCheckpointId as AwakeningWardSaveState['lastCheckpointId']
    : 'capsule';
  let inventory = normalizeInventory(value.inventory);

  if (!puzzleFlags.hidden_drawer_opened) {
    inventory = inventory.filter((entry) => entry.id !== 'keycard_a07');
  }
  if (
    puzzleFlags.awakening_exit_unlocked
    && !inventory.some((entry) => entry.id === 'keycard_a07')
  ) {
    puzzleFlags.awakening_exit_unlocked = false;
  }

  const collectedClues = Array.isArray(value.collectedClues)
    ? [...new Set(value.collectedClues.filter(
        (clue): clue is WardClueId => WARD_CLUE_IDS.includes(
          clue as WardClueId,
        ),
      ))]
    : [];
  const collectedPickupIds = Array.isArray(value.collectedPickupIds)
    ? [...new Set(value.collectedPickupIds.filter(
        (id): id is 'medical_patch' | 'battery' => (
          id === 'medical_patch' || id === 'battery'
        ),
      ))]
    : [];

  if (puzzleFlags.clock_1111_inspected) {
    collectedClues.push('clock_freeze_observation');
  }
  if (puzzleFlags.monitor_activated) {
    collectedClues.push('monitor_reflection_directive');
  }
  if (puzzleFlags.mirror_clue_discovered) {
    collectedClues.push('mirror_symbol_sequence');
  }

  return {
    schemaVersion: 1,
    currentZoneId: 'awakening-ward-a01',
    playerPosition: normalizePosition(value.playerPosition, lastCheckpointId),
    lastCheckpointId,
    puzzleFlags,
    inventory,
    collectedPickupIds,
    collectedClues: [...new Set(collectedClues)],
    health: clampMetric(value.health, initial.health),
    stamina: clampMetric(value.stamina, initial.stamina),
    awakeningWardCompleted: puzzleFlags.awakening_exit_unlocked,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function withTimestamp(
  state: AwakeningWardSaveState,
): AwakeningWardSaveState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

function grantItem(
  state: AwakeningWardSaveState,
  itemId: WardItemId,
): AwakeningWardSaveState {
  const existing = state.inventory.find((entry) => entry.id === itemId);
  if (existing) {
    const maxStack = WARD_ITEM_CATALOG[itemId].maxStack;
    if (existing.quantity >= maxStack) return state;
    return withTimestamp({
      ...state,
      inventory: state.inventory.map((entry) => (
        entry.id === itemId
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry
      )),
    });
  }
  if (state.inventory.length >= AWAKENING_WARD_INVENTORY_CAPACITY) {
    return state;
  }
  return withTimestamp({
    ...state,
    inventory: [...state.inventory, { id: itemId, quantity: 1 }],
  });
}

function grantFlag(
  state: AwakeningWardSaveState,
  flag: AwakeningWardFlag,
): AwakeningWardSaveState {
  if (state.puzzleFlags[flag]) return state;
  if (!FLAG_PREREQUISITES[flag].every(
    (requiredFlag) => state.puzzleFlags[requiredFlag],
  )) {
    return state;
  }
  return withTimestamp({
    ...state,
    puzzleFlags: { ...state.puzzleFlags, [flag]: true },
  });
}

function grantClue(
  state: AwakeningWardSaveState,
  clueId: WardClueId,
): AwakeningWardSaveState {
  if (state.collectedClues.includes(clueId)) return state;
  return withTimestamp({
    ...state,
    collectedClues: [...state.collectedClues, clueId],
  });
}

export function interactionRequirementsMet(
  state: AwakeningWardSaveState,
  interaction: WardInteractionDefinition,
): boolean {
  return interaction.requiredFlags.every(
    (flag) => state.puzzleFlags[flag],
  ) && (
    !interaction.requiredItem
    || hasWardItem(state, interaction.requiredItem)
  );
}

export type WardProgressEvent =
  | 'inspect-clock'
  | 'restore-power'
  | 'activate-monitor'
  | 'record-mirror-clue'
  | 'open-hidden-drawer'
  | 'take-keycard'
  | 'unlock-exit'
  | 'collect-medical-patch'
  | 'collect-battery'
  | 'use-medical-patch';

export function applyAwakeningWardProgress(
  state: AwakeningWardSaveState,
  event: WardProgressEvent,
): AwakeningWardSaveState {
  let next = state;
  switch (event) {
    case 'inspect-clock':
      next = grantFlag(next, 'clock_1111_inspected');
      return grantClue(next, 'clock_freeze_observation');
    case 'restore-power':
      return grantFlag(next, 'power_restored');
    case 'activate-monitor':
      next = grantFlag(next, 'monitor_activated');
      return next.puzzleFlags.monitor_activated
        ? grantClue(next, 'monitor_reflection_directive')
        : next;
    case 'record-mirror-clue':
      next = grantFlag(next, 'mirror_clue_discovered');
      return next.puzzleFlags.mirror_clue_discovered
        ? grantClue(next, 'mirror_symbol_sequence')
        : next;
    case 'open-hidden-drawer':
      return grantFlag(next, 'hidden_drawer_opened');
    case 'take-keycard':
      return next.puzzleFlags.hidden_drawer_opened
        ? grantItem(next, 'keycard_a07')
        : next;
    case 'unlock-exit': {
      if (next.puzzleFlags.awakening_exit_unlocked) return next;
      if (!hasWardItem(next, 'keycard_a07')) return next;
      next = grantFlag(next, 'awakening_exit_unlocked');
      return next.puzzleFlags.awakening_exit_unlocked
        ? withTimestamp({ ...next, awakeningWardCompleted: true })
        : next;
    }
    case 'collect-medical-patch':
      if (next.collectedPickupIds.includes('medical_patch')) return next;
      next = grantItem(next, 'medical_patch');
      return hasWardItem(next, 'medical_patch')
        ? withTimestamp({
            ...next,
            collectedPickupIds: [
              ...next.collectedPickupIds,
              'medical_patch',
            ],
          })
        : next;
    case 'collect-battery':
      if (next.collectedPickupIds.includes('battery')) return next;
      next = grantItem(next, 'battery');
      return hasWardItem(next, 'battery')
        ? withTimestamp({
            ...next,
            collectedPickupIds: [...next.collectedPickupIds, 'battery'],
          })
        : next;
    case 'use-medical-patch': {
      if (next.health >= 100 || !hasWardItem(next, 'medical_patch')) {
        return next;
      }
      const inventory = next.inventory.flatMap((entry) => {
        if (entry.id !== 'medical_patch') return [entry];
        return entry.quantity > 1
          ? [{ ...entry, quantity: entry.quantity - 1 }]
          : [];
      });
      return withTimestamp({
        ...next,
        health: Math.min(100, next.health + 30),
        inventory,
      });
    }
  }
}

export function updateAwakeningWardRuntime(
  state: AwakeningWardSaveState,
  patch: {
    playerPosition?: WardPoint;
    stamina?: number;
    lastCheckpointId?: AwakeningWardSaveState['lastCheckpointId'];
  },
): AwakeningWardSaveState {
  const checkpointId = patch.lastCheckpointId ?? state.lastCheckpointId;
  const next = {
    ...state,
    playerPosition: patch.playerPosition ?? state.playerPosition,
    stamina: patch.stamina ?? state.stamina,
    lastCheckpointId: checkpointId,
    updatedAt: new Date().toISOString(),
  };
  return normalizeAwakeningWardState(next);
}
