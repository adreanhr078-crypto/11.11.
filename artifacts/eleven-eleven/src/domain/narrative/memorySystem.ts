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

export type EligibleMemorySource =
  | {
      kind: 'memory';
      definition: MemoryDefinition;
    }
  | {
      kind: 'fragment';
      definition: MemoryDefinition;
      fragment: MemoryFragmentDefinition;
    };

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

/**
 * Finds one authored Memory source without applying its effects. Application
 * code can validate and commit that source through the canonical transaction,
 * then evaluate again against the resulting local state.
 */
export function findNextEligibleMemorySource(
  definitions: readonly MemoryDefinition[],
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
  },
): EligibleMemorySource | null {
  const context = makeRuleContext(params);
  for (const definition of definitions) {
    if (
      !params.narrative.unlockedMemoryIds.includes(definition.id)
      && conditionsPass([definition.unlockCondition], context)
    ) {
      return { kind: 'memory', definition };
    }
    for (const fragment of definition.fragments) {
      if (
        !params.narrative.unlockedMemoryFragmentIds.includes(fragment.id)
        && conditionsPass([fragment.unlockCondition], context)
      ) {
        return { kind: 'fragment', definition, fragment };
      }
    }
  }
  return null;
}

/**
 * @deprecated Compatibility-only pure engine for legacy callers and fixtures.
 * Active Store writes use the source-owned canonical narrative transaction.
 */
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
