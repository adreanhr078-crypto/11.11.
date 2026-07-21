import { useGameStore } from '../stores/gameStore';

export type TimeState = 'day' | 'night' | 'transition';
export type NightPhase = '11:00' | '11:05' | '11:11' | null;
export type EventType = 'time:change' | 'night:advance' | 'memory:add' | 'flower:grow' | 'world:reset';

export interface WorldState {
  timeState: TimeState;
  nightPhase: NightPhase;
  echo: {
    mood: string;
    trust: number;
    fear: number;
    memoryStability: number;
    corruption: number;
    hope: number;
    loneliness: number;
    awareness: number;
  };
  instabilityLevel: number;
  memoryFragments: string[];
  flowersGrowth: number;
  nightPhaseIndex: number;
}

const listeners = new Set<(state: WorldState) => void>();

export function getState(): WorldState {
  const s = useGameStore.getState();
  const isNight = s.time.isNight;
  const phase = s.time.phase;
  let timeState: TimeState = 'day';
  let nightPhase: NightPhase = null;

  if (isNight) {
    timeState = 'night';
    if (phase === '11:00') nightPhase = '11:00';
    else if (phase === '11:05') nightPhase = '11:05';
    else if (phase === '11:11') nightPhase = '11:11';
  }

  return {
    timeState,
    nightPhase,
    echo: {
      mood: s.echo.mood,
      trust: s.echo.trust,
      fear: s.echo.fear,
      memoryStability: s.echo.memoryStability,
      corruption: s.echo.corruption,
      hope: s.echo.hope,
      loneliness: s.echo.loneliness,
      awareness: s.echo.awareness,
    },
    instabilityLevel: Math.max(0, s.world.glitchLevel + s.echo.corruption),
    memoryFragments: [],
    flowersGrowth: s.flower.growth,
    nightPhaseIndex: s.time.phaseIndex,
  };
}

export function subscribe(listener: (state: WorldState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emit(_eventType: EventType, _payload?: Record<string, unknown>): void {
  const state = getState();
  listeners.forEach((listener) => listener(state));
}

export function setTimeState(_timeState: TimeState, _nightPhase?: NightPhase): void {
  emit('time:change');
}

export function advanceNightPhase(): void {
  emit('night:advance');
}

export function addMemoryFragment(_fragment: string): void {
  emit('memory:add');
}

export function growFlowers(_amount: number): void {
  emit('flower:grow');
}

export function reset(): void {
  emit('world:reset');
}

export const worldState = {
  getState,
  subscribe,
  emit,
  setTimeState,
  advanceNightPhase,
  addMemoryFragment,
  growFlowers,
  reset,
};
