import {
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import {
  OPENING_ROOM_INTERACTIONS,
  type OpeningRoomInteractionContext,
} from '../data/openingRoom.interactions';
import {
  findNearestEnabledInteraction,
} from '../systems/interactionSystem';

interface UseInteractionOptions {
  playerRef: MutableRefObject<Group | null>;
  context: OpeningRoomInteractionContext;
  enabled: boolean;
  onNearestChange: (interactionId: string | null) => void;
}

export function useInteraction({
  playerRef,
  context,
  enabled,
  onNearestChange,
}: UseInteractionOptions) {
  const elapsedRef = useRef(0);
  const nearestIdRef = useRef<string | null>(null);
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    if (enabled) return;
    nearestIdRef.current = null;
    onNearestChange(null);
  }, [enabled, onNearestChange]);

  useFrame((_, delta) => {
    if (!enabled || !playerRef.current) return;
    elapsedRef.current += delta;
    if (elapsedRef.current < 0.08) return;
    elapsedRef.current = 0;

    const { x, y, z } = playerRef.current.position;
    const nearest = findNearestEnabledInteraction(
      { x, y, z },
      OPENING_ROOM_INTERACTIONS,
      contextRef.current,
    );
    const nextId = nearest?.interaction.id ?? null;

    if (nextId === nearestIdRef.current) return;
    nearestIdRef.current = nextId;
    onNearestChange(nextId);
  });
}
