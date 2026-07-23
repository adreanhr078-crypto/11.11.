import type {
  MemoryDefinition,
  MemoryFragmentDefinition,
  MemoryFragmentId,
  MemoryId,
} from '../content/contracts';
import {
  applyEchoPersonalityEffects,
  type EchoPersonality,
} from '../echo/echoPersonality';
import type { ProgressionState } from '../progression/progression';
import type { NarrativeState } from './narrativeState';
import {
  conditionsPass,
  makeRuleContext,
} from './ruleEngine';

export interface MemoryUnlockResult {
  narrative: NarrativeState;
  echo: EchoPersonality;
  unlockedMemoryIds: MemoryId[];
  unlockedFragmentIds: MemoryFragmentId[];
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function getUnlockedMemoryDefinitions(
  definitions: readonly MemoryDefinition[],
  narrative: NarrativeState,
): MemoryDefinition[] {
  const unlocked = new Set(narrative.unlockedMemoryIds);
  return definitions.filter((definition) => unlocked.has(definition.id));
}

export function getUnlockedMemoryFragments(
  definitions: readonly MemoryDefinition[],
  narrative: NarrativeState,
): Array<{
  memoryId: MemoryId;
  fragment: MemoryFragmentDefinition;
}> {
  const unlocked = new Set(narrative.unlockedMemoryFragmentIds);
  return definitions.flatMap((definition) => (
    definition.fragments
      .filter((fragment) => unlocked.has(fragment.id))
      .map((fragment) => ({ memoryId: definition.id, fragment }))
  ));
}

export function unlockEligibleMemories(
  definitions: readonly MemoryDefinition[],
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
  },
): MemoryUnlockResult {
  let echo = params.echo;
  let narrative = {
    ...params.narrative,
    unlockedMemoryIds: [...params.narrative.unlockedMemoryIds],
    unlockedMemoryFragmentIds: [
      ...params.narrative.unlockedMemoryFragmentIds,
    ],
  };
  const newlyUnlockedMemoryIds: MemoryId[] = [];
  const newlyUnlockedFragmentIds: MemoryFragmentId[] = [];

  for (const definition of definitions) {
    const context = makeRuleContext({
      echo,
      progression: params.progression,
      narrative,
    });
    const memoryAlreadyUnlocked = narrative.unlockedMemoryIds.includes(
      definition.id,
    );

    if (
      !memoryAlreadyUnlocked
      && conditionsPass([definition.unlockCondition], context)
    ) {
      narrative.unlockedMemoryIds = unique([
        ...narrative.unlockedMemoryIds,
        definition.id,
      ]);
      newlyUnlockedMemoryIds.push(definition.id);
      echo = applyEchoPersonalityEffects(echo, definition.emotionalImpact);
    }

    for (const fragment of definition.fragments) {
      const fragmentAlreadyUnlocked =
        narrative.unlockedMemoryFragmentIds.includes(fragment.id);
      const fragmentContext = makeRuleContext({
        echo,
        progression: params.progression,
        narrative,
      });

      if (
        !fragmentAlreadyUnlocked
        && conditionsPass([fragment.unlockCondition], fragmentContext)
      ) {
        narrative.unlockedMemoryIds = unique([
          ...narrative.unlockedMemoryIds,
          definition.id,
        ]);
        narrative.unlockedMemoryFragmentIds = unique([
          ...narrative.unlockedMemoryFragmentIds,
          fragment.id,
        ]);
        newlyUnlockedFragmentIds.push(fragment.id);
        echo = applyEchoPersonalityEffects(echo, fragment.emotionalImpact);
      }
    }
  }

  return {
    echo,
    narrative,
    unlockedMemoryIds: newlyUnlockedMemoryIds,
    unlockedFragmentIds: newlyUnlockedFragmentIds,
  };
}

