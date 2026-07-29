import type {
  ChapterId,
  ContentCondition,
  ContentEffect,
  EchoStat,
  MemoryFragmentId,
  MemoryId,
  PuzzleId,
  SceneId,
} from '../content/contracts';
import type { EchoPersonality } from '../echo/echoPersonality';
import {
  applyEchoPersonalityEffects,
} from '../echo/echoPersonality';
import type { ProgressionState } from '../progression/progression';
import type {
  DecisionRecord,
  NarrativeState,
} from './narrativeState';

export interface RuleEvaluationContext {
  echo: EchoPersonality;
  progression: ProgressionState;
  narrative: NarrativeState;
}

export interface ConditionResult {
  passed: boolean;
  reason: string;
}

export interface EffectApplicationResult {
  echo: EchoPersonality;
  narrative: NarrativeState;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function statValue(echo: EchoPersonality, stat: EchoStat): number {
  return echo[stat] ?? 0;
}

export function evaluateCondition(
  condition: ContentCondition,
  context: RuleEvaluationContext,
): ConditionResult {
  switch (condition.kind) {
    case 'all': {
      const results = condition.conditions.map((item) => (
        evaluateCondition(item, context)
      ));
      const failed = results.find((result) => !result.passed);
      return failed ?? { passed: true, reason: 'all conditions passed' };
    }
    case 'any': {
      const results = condition.conditions.map((item) => (
        evaluateCondition(item, context)
      ));
      const passed = results.find((result) => result.passed);
      return passed ?? {
        passed: false,
        reason: results.map((result) => result.reason).join('; '),
      };
    }
    case 'not': {
      const result = evaluateCondition(condition.condition, context);
      return {
        passed: !result.passed,
        reason: result.passed
          ? `not failed because ${result.reason}`
          : `not passed because ${result.reason}`,
      };
    }
    case 'statAtLeast': {
      const actual = statValue(context.echo, condition.stat);
      return {
        passed: actual >= condition.value,
        reason: `${condition.stat} ${actual} >= ${condition.value}`,
      };
    }
    case 'statAtMost': {
      const actual = statValue(context.echo, condition.stat);
      return {
        passed: actual <= condition.value,
        reason: `${condition.stat} ${actual} <= ${condition.value}`,
      };
    }
    case 'puzzleSolved':
      return {
        passed: context.progression.completedPuzzleIds.includes(
          condition.puzzleId,
        ),
        reason: `${condition.puzzleId} solved`,
      };
    case 'memoryCollected':
      return {
        passed: context.narrative.unlockedMemoryIds.includes(
          condition.memoryId,
        ),
        reason: `${condition.memoryId} unlocked`,
      };
    case 'memoryFragmentUnlocked':
      return {
        passed: context.narrative.unlockedMemoryFragmentIds.includes(
          condition.fragmentId,
        ),
        reason: `${condition.fragmentId} unlocked`,
      };
    case 'choiceIs':
      return {
        passed: context.narrative.latestDecisions[condition.decisionId]
          === condition.choiceId,
        reason: `${condition.decisionId} is ${condition.choiceId}`,
      };
    case 'decisionMade':
      return {
        passed: condition.decisionId in context.narrative.latestDecisions,
        reason: `${condition.decisionId} has a recorded choice`,
      };
    case 'flagIs':
      return {
        passed: context.narrative.activeFlags[condition.flag]
          === condition.value,
        reason: `${condition.flag} is ${String(condition.value)}`,
      };
    case 'chapterComplete':
      return {
        passed: context.progression.completedChapterIds.includes(
          condition.chapterId,
        ),
        reason: `${condition.chapterId} complete`,
      };
    default:
      return assertNever(condition);
  }
}

export function evaluateConditions(
  conditions: readonly ContentCondition[],
  context: RuleEvaluationContext,
): ConditionResult[] {
  return conditions.map((condition) => evaluateCondition(condition, context));
}

export function conditionsPass(
  conditions: readonly ContentCondition[],
  context: RuleEvaluationContext,
): boolean {
  return evaluateConditions(conditions, context).every((result) => (
    result.passed
  ));
}

/**
 * @deprecated Compatibility-only effect evaluator. It may be used off-store
 * to inspect legacy authored data, but active permanent writes must commit
 * through a source-owned canonical transaction.
 */
export function applyContentEffects(
  effects: readonly ContentEffect[],
  context: RuleEvaluationContext,
  source: DecisionRecord['source'] = 'system',
  createdAt = Date.now(),
): EffectApplicationResult {
  let echo = context.echo;
  let narrative = {
    ...context.narrative,
    activeFlags: { ...context.narrative.activeFlags },
    latestDecisions: { ...context.narrative.latestDecisions },
    decisionHistory: [...context.narrative.decisionHistory],
    dialogue: {
      ...context.narrative.dialogue,
      completedDialogueIds: [
        ...context.narrative.dialogue.completedDialogueIds,
      ],
    },
    pendingSceneIds: [...context.narrative.pendingSceneIds],
    unlockedMemoryIds: [...context.narrative.unlockedMemoryIds],
    unlockedMemoryFragmentIds: [
      ...context.narrative.unlockedMemoryFragmentIds,
    ],
    endingEligibility: [...context.narrative.endingEligibility],
  };

  for (const effect of effects) {
    switch (effect.kind) {
      case 'adjustStat':
        echo = applyEchoPersonalityEffects(echo, {
          [effect.stat]: effect.amount,
        });
        break;
      case 'collectMemory':
        narrative.unlockedMemoryIds = unique([
          ...narrative.unlockedMemoryIds,
          effect.memoryId,
        ]);
        break;
      case 'unlockMemoryFragment':
        narrative.unlockedMemoryIds = unique([
          ...narrative.unlockedMemoryIds,
          effect.memoryId,
        ]);
        narrative.unlockedMemoryFragmentIds = unique([
          ...narrative.unlockedMemoryFragmentIds,
          effect.fragmentId,
        ]);
        break;
      case 'queueScene':
        narrative.pendingSceneIds = unique([
          ...narrative.pendingSceneIds,
          effect.sceneId,
        ]);
        break;
      case 'setFlag':
        narrative.activeFlags[effect.flag] = effect.value;
        break;
      case 'recordChoice': {
        narrative.latestDecisions[effect.decisionId] = effect.choiceId;
        narrative.decisionHistory = [
          ...narrative.decisionHistory,
          {
            id: effect.decisionId,
            choiceId: effect.choiceId,
            source,
            createdAt,
          },
        ];
        break;
      }
      case 'unlockPuzzle':
      case 'awardCurrency':
        break;
      default:
        assertNever(effect);
    }
  }

  return { echo, narrative };
}

export function makeRuleContext(params: {
  echo: EchoPersonality;
  progression: ProgressionState;
  narrative: NarrativeState;
}): RuleEvaluationContext {
  return params;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled narrative rule: ${JSON.stringify(value)}`);
}

export type {
  ChapterId,
  MemoryFragmentId,
  MemoryId,
  PuzzleId,
  SceneId,
};
