import {
  AWAKENING_WARD_EXIT_APPROACH,
  AWAKENING_WARD_OBSTACLES,
  AWAKENING_WARD_SPAWN,
  AWAKENING_WARD_WALKABLE_ZONES,
  EXIT_CORRIDOR_CLEARANCE,
} from '../data/awakeningWardMap';
import type {
  WardPoint,
  WardRect,
} from './awakeningWardTypes';

export const WARD_PLAYER_RADIUS = 0.68;

export function resolveWardCameraZoom(width: number, height: number): number {
  const requested = Math.min(width / 1360, height / 760);
  return Math.max(0.78, Math.min(1.18, requested));
}

function containsPoint(
  rect: WardRect,
  point: WardPoint,
  margin = 0,
): boolean {
  return point.x >= rect.x + margin
    && point.x <= rect.x + rect.width - margin
    && point.y >= rect.y + margin
    && point.y <= rect.y + rect.height - margin;
}

function circleIntersectsRect(
  point: WardPoint,
  radius: number,
  rect: WardRect,
): boolean {
  const nearestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const dx = point.x - nearestX;
  const dy = point.y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function isWardPositionWalkable(
  point: WardPoint,
  radius = WARD_PLAYER_RADIUS,
): boolean {
  const insideZone = AWAKENING_WARD_WALKABLE_ZONES.some(
    (zone) => containsPoint(zone, point, radius),
  );
  if (!insideZone) return false;
  return !AWAKENING_WARD_OBSTACLES.some(
    (obstacle) => circleIntersectsRect(point, radius, obstacle),
  );
}

export function moveWardPlayer(
  position: WardPoint,
  velocity: WardPoint,
  deltaSeconds: number,
): WardPoint {
  const requested = {
    x: position.x + velocity.x * deltaSeconds,
    y: position.y + velocity.y * deltaSeconds,
  };
  if (isWardPositionWalkable(requested)) return requested;

  const slideX = { x: requested.x, y: position.y };
  if (isWardPositionWalkable(slideX)) return slideX;

  const slideY = { x: position.x, y: requested.y };
  if (isWardPositionWalkable(slideY)) return slideY;
  return position;
}

function rectsOverlap(a: WardRect, b: WardRect): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function isExitCorridorClear(): boolean {
  return !AWAKENING_WARD_OBSTACLES.some(
    (obstacle) => rectsOverlap(obstacle, EXIT_CORRIDOR_CLEARANCE),
  );
}

function gridKey(point: WardPoint, step: number): string {
  return `${Math.round(point.x / step)},${Math.round(point.y / step)}`;
}

export function findWardPath(
  start: WardPoint = AWAKENING_WARD_SPAWN,
  goal: WardPoint = AWAKENING_WARD_EXIT_APPROACH,
  step = 0.5,
): WardPoint[] | null {
  if (!isWardPositionWalkable(start) || !isWardPositionWalkable(goal)) {
    return null;
  }
  const queue: WardPoint[] = [start];
  const startKey = gridKey(start, step);
  const parent = new Map<string, string | null>([[startKey, null]]);
  const points = new Map<string, WardPoint>([[startKey, start]]);
  const directions = [
    { x: step, y: 0 },
    { x: -step, y: 0 },
    { x: 0, y: step },
    { x: 0, y: -step },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (Math.hypot(current.x - goal.x, current.y - goal.y) <= step) {
      const result: WardPoint[] = [];
      let key: string | null = gridKey(current, step);
      while (key) {
        result.push(points.get(key)!);
        key = parent.get(key) ?? null;
      }
      return result.reverse();
    }
    for (const direction of directions) {
      const next = {
        x: Math.round((current.x + direction.x) / step) * step,
        y: Math.round((current.y + direction.y) / step) * step,
      };
      const key = gridKey(next, step);
      if (parent.has(key) || !isWardPositionWalkable(next)) continue;
      parent.set(key, gridKey(current, step));
      points.set(key, next);
      queue.push(next);
    }
  }
  return null;
}
