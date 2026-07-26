import type {
  InteractionDefinition,
  NarrativeEffect,
  NearestInteraction,
  Vector3,
} from '../types/gameplay.types';

export function distanceBetween(
  first: Vector3,
  second: Vector3,
): number {
  return Math.hypot(
    second.x - first.x,
    second.y - first.y,
    second.z - first.z,
  );
}

export function isInteractionEnabled<
  TContext,
  TEffect extends NarrativeEffect,
>(
  interaction: InteractionDefinition<TContext, TEffect>,
  context: TContext,
): boolean {
  return interaction.interactionDistance >= 0
    && interaction.enabledCondition(context);
}

export function findNearestEnabledInteraction<
  TContext,
  TEffect extends NarrativeEffect,
  TInteraction extends InteractionDefinition<TContext, TEffect>,
>(
  playerPosition: Vector3,
  interactions: readonly TInteraction[],
  context: TContext,
): NearestInteraction<TInteraction> | null {
  let nearest: NearestInteraction<TInteraction> | null = null;

  for (const interaction of interactions) {
    if (!isInteractionEnabled(interaction, context)) continue;

    const distance = distanceBetween(
      playerPosition,
      interaction.position,
    );
    if (!Number.isFinite(distance)) continue;
    if (distance > interaction.interactionDistance) continue;

    if (nearest === null || distance < nearest.distance) {
      nearest = { interaction, distance };
    }
  }

  return nearest;
}
