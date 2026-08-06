export type CircuitSide = 'north' | 'east' | 'south' | 'west';
export type CircuitTileType = 'empty' | 'straight' | 'corner' | 'tee';

export interface CircuitTileDefinition {
  type: CircuitTileType;
  solutionRotation: number;
}

export const CIRCUIT_GRID_SIZE = 4;

export const CIRCUIT_TILES: readonly CircuitTileDefinition[] = [
  { type: 'empty', solutionRotation: 0 },
  { type: 'corner', solutionRotation: 2 },
  { type: 'straight', solutionRotation: 1 },
  { type: 'empty', solutionRotation: 0 },
  { type: 'straight', solutionRotation: 1 },
  { type: 'straight', solutionRotation: 1 },
  { type: 'tee', solutionRotation: 1 },
  { type: 'straight', solutionRotation: 1 },
  { type: 'corner', solutionRotation: 3 },
  { type: 'empty', solutionRotation: 0 },
  { type: 'straight', solutionRotation: 0 },
  { type: 'corner', solutionRotation: 1 },
  { type: 'straight', solutionRotation: 0 },
  { type: 'corner', solutionRotation: 0 },
  { type: 'straight', solutionRotation: 0 },
  { type: 'empty', solutionRotation: 0 },
] as const;

export const INITIAL_CIRCUIT_ROTATIONS = [
  0, 0, 0, 0,
  0, 1, 0, 0,
  1, 0, 1, 2,
  1, 3, 1, 0,
] as const;

const BASE_CONNECTIONS: Readonly<Record<CircuitTileType, CircuitSide[]>> = {
  empty: [],
  straight: ['north', 'south'],
  corner: ['north', 'east'],
  tee: ['north', 'east', 'south'],
};

const SIDE_ORDER: CircuitSide[] = ['north', 'east', 'south', 'west'];
const OPPOSITE: Readonly<Record<CircuitSide, CircuitSide>> = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east',
};

export function circuitConnections(
  type: CircuitTileType,
  rotation: number,
): CircuitSide[] {
  return BASE_CONNECTIONS[type].map((side) => {
    const index = SIDE_ORDER.indexOf(side);
    return SIDE_ORDER[(index + rotation) % SIDE_ORDER.length]!;
  });
}

function neighbor(index: number, side: CircuitSide): number | null {
  const row = Math.floor(index / CIRCUIT_GRID_SIZE);
  const column = index % CIRCUIT_GRID_SIZE;
  if (side === 'north' && row > 0) return index - CIRCUIT_GRID_SIZE;
  if (side === 'east' && column < CIRCUIT_GRID_SIZE - 1) return index + 1;
  if (side === 'south' && row < CIRCUIT_GRID_SIZE - 1) return index + CIRCUIT_GRID_SIZE;
  if (side === 'west' && column > 0) return index - 1;
  return null;
}

export function poweredCircuitTiles(
  rotations: readonly number[],
): Set<number> {
  const sourceIndex = 4;
  const sourceConnections = circuitConnections(
    CIRCUIT_TILES[sourceIndex]!.type,
    rotations[sourceIndex] ?? 0,
  );
  if (!sourceConnections.includes('west')) return new Set();

  const powered = new Set<number>([sourceIndex]);
  const queue = [sourceIndex];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const connections = circuitConnections(
      CIRCUIT_TILES[current]!.type,
      rotations[current] ?? 0,
    );
    for (const side of connections) {
      const next = neighbor(current, side);
      if (next === null || powered.has(next)) continue;
      const nextConnections = circuitConnections(
        CIRCUIT_TILES[next]!.type,
        rotations[next] ?? 0,
      );
      if (!nextConnections.includes(OPPOSITE[side])) continue;
      powered.add(next);
      queue.push(next);
    }
  }
  return powered;
}

export function isCircuitSolved(rotations: readonly number[]): boolean {
  const powered = poweredCircuitTiles(rotations);
  const eastOutputConnected = powered.has(7)
    && circuitConnections('straight', rotations[7] ?? 0).includes('east');
  const southOutputConnected = powered.has(14)
    && circuitConnections('straight', rotations[14] ?? 0).includes('south');
  return eastOutputConnected && southOutputConnected;
}

export function circuitGlyph(
  type: CircuitTileType,
  rotation: number,
): string {
  const normalized = ((rotation % 4) + 4) % 4;
  if (type === 'empty') return '·';
  if (type === 'straight') return normalized % 2 === 0 ? '│' : '─';
  if (type === 'corner') return ['└', '┌', '┐', '┘'][normalized]!;
  return ['├', '┬', '┤', '┴'][normalized]!;
}
