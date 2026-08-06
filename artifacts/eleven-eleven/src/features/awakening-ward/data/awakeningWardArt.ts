import type { WardObjectKind } from '../domain/awakeningWardTypes';

export const WARD_ART_KEYS = {
  floor: 'ward-floor-atlas-v2',
  items: 'ward-items-atlas-v2',
  playerNorthEast: 'ward-player-north-east-atlas-v3',
  playerSouthWest: 'ward-player-south-west-atlas-v3',
  props: 'ward-props-atlas-v2',
  walls: 'ward-wall-atlas-v2',
} as const;

export const WARD_ART_PATHS = {
  cosmos: '/assets/awakening-ward/art-pass-v2/void-cosmos.webp',
  floor: '/assets/awakening-ward/art-pass-v2/floor-atlas.webp',
  items: '/assets/awakening-ward/art-pass-v2/items-atlas.webp',
  playerNorthEast:
    '/assets/awakening-ward/art-pass-v2/player-north-east-atlas.webp',
  playerSouthWest:
    '/assets/awakening-ward/art-pass-v2/player-south-west-atlas.webp',
  props: '/assets/awakening-ward/art-pass-v2/props-atlas.webp',
  walls: '/assets/awakening-ward/art-pass-v2/wall-atlas.webp',
} as const;

export const WARD_ART_FRAMES = {
  floor: 627,
  item: 627,
  playerWidth: 314,
  playerHeight: 314,
  prop: 418,
  wall: 627,
} as const;

export const WARD_FLOOR_FRAMES = {
  accessPanel: 0,
  serviceVent: 1,
  warningPlate: 2,
  corridorGuide: 3,
} as const;

export const WARD_ITEM_FRAMES = {
  keycard: 0,
  medicalPatch: 1,
  battery: 2,
  clueNote: 3,
} as const;

interface WardPropVisual {
  frame: number;
  scale: number;
  originY: number;
  shadowWidth: number;
  shadowHeight: number;
  offsetX?: number;
  offsetY?: number;
  emissive?: 'cyan' | 'red';
}

export const WARD_PROP_VISUALS: Partial<Record<WardObjectKind, WardPropVisual>> = {
  capsule: {
    frame: 0,
    scale: 0.66,
    originY: 0.87,
    shadowWidth: 235,
    shadowHeight: 62,
    offsetY: 4,
    emissive: 'red',
  },
  'power-panel': {
    frame: 1,
    scale: 0.46,
    originY: 0.89,
    shadowWidth: 108,
    shadowHeight: 34,
    offsetY: 3,
    emissive: 'red',
  },
  'monitor-bank': {
    frame: 2,
    scale: 0.66,
    originY: 0.88,
    shadowWidth: 225,
    shadowHeight: 47,
    offsetY: 4,
    emissive: 'cyan',
  },
  storage: {
    frame: 3,
    scale: 0.5,
    originY: 0.9,
    shadowWidth: 122,
    shadowHeight: 34,
    offsetY: 4,
    emissive: 'red',
  },
  'exit-door': {
    frame: 4,
    scale: 0.55,
    originY: 0.91,
    shadowWidth: 136,
    shadowHeight: 30,
    offsetY: 5,
    emissive: 'red',
  },
  'medical-console': {
    frame: 5,
    scale: 0.43,
    originY: 0.9,
    shadowWidth: 92,
    shadowHeight: 31,
    offsetY: 4,
    emissive: 'cyan',
  },
  'side-table': {
    frame: 6,
    scale: 0.42,
    originY: 0.9,
    shadowWidth: 112,
    shadowHeight: 34,
    offsetY: 4,
  },
  crate: {
    frame: 7,
    scale: 0.39,
    originY: 0.88,
    shadowWidth: 105,
    shadowHeight: 34,
    offsetY: 4,
    emissive: 'red',
  },
  chair: {
    frame: 8,
    scale: 0.38,
    originY: 0.91,
    shadowWidth: 72,
    shadowHeight: 25,
    offsetY: 3,
  },
};

export const WARD_PLAYER_DIRECTION_ROWS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const;

export interface WardPlayerVisual {
  textureKey: typeof WARD_ART_KEYS.playerNorthEast
    | typeof WARD_ART_KEYS.playerSouthWest;
  frameRow: number;
  flipX: boolean;
}

// Symmetrical directions share authored poses so left/right movement reads cleanly.
export const WARD_PLAYER_VISUALS: readonly WardPlayerVisual[] = [
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 0, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 1, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 2, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 3, flipX: false },
  { textureKey: WARD_ART_KEYS.playerSouthWest, frameRow: 0, flipX: false },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 3, flipX: true },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 2, flipX: true },
  { textureKey: WARD_ART_KEYS.playerNorthEast, frameRow: 1, flipX: true },
] as const;

export function resolveWardPlayerFacingRow(x: number, y: number): number {
  const angle = Math.atan2(y, x);
  const clockwiseFromNorth = Math.round(
    (angle + Math.PI / 2) / (Math.PI / 4),
  );
  return ((clockwiseFromNorth % 8) + 8) % 8;
}

export function resolveWardPlayerVisual(row: number): WardPlayerVisual {
  return WARD_PLAYER_VISUALS[row] ?? WARD_PLAYER_VISUALS[4]!;
}

export function resolveWardPlayerFrame(row: number, column: number): number {
  return resolveWardPlayerVisual(row).frameRow * 4 + column;
}
