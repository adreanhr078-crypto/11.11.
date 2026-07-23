import type {
  EndingDefinition,
  EndingId,
} from '../content/contracts';
import type { EchoPersonality } from '../echo/echoPersonality';
import type { ProgressionState } from '../progression/progression';
import type {
  EndingEligibility,
  NarrativeState,
} from './narrativeState';
import {
  evaluateConditions,
  makeRuleContext,
} from './ruleEngine';

export interface EndingEvaluationResult {
  eligibility: EndingEligibility[];
  eligibleEndingIds: EndingId[];
}

export function evaluateEndingEligibility(
  definitions: readonly EndingDefinition[],
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
  },
): EndingEvaluationResult {
  const context = makeRuleContext(params);
  const eligibility = definitions.map((definition) => {
    const results = evaluateConditions(definition.conditions, context);
    const metConditions = results.filter((result) => result.passed).length;
    return {
      endingId: definition.id,
      eligible: results.every((result) => result.passed),
      metConditions,
      totalConditions: results.length,
      unmetReasons: results
        .filter((result) => !result.passed)
        .map((result) => result.reason),
    };
  });

  return {
    eligibility,
    eligibleEndingIds: eligibility
      .filter((item) => item.eligible)
      .map((item) => item.endingId),
  };
}

export function withEvaluatedEndings(
  narrative: NarrativeState,
  definitions: readonly EndingDefinition[],
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
  },
): NarrativeState {
  const result = evaluateEndingEligibility(definitions, {
    ...params,
    narrative,
  });

  return {
    ...narrative,
    endingEligibility: result.eligibility,
  };
}

