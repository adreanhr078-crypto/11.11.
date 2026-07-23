import type {
  ContentEffect,
  DialogueDefinition,
  DialogueNode,
} from '../content/contracts';
import type { EchoPersonality } from '../echo/echoPersonality';
import type { ProgressionState } from '../progression/progression';
import type { NarrativeState } from './narrativeState';
import {
  applyContentEffects,
  conditionsPass,
  makeRuleContext,
} from './ruleEngine';
import { recordDecision } from './decisionLedger';

export interface DialogueChoiceView {
  id: string;
  text: DialogueNode['text'];
}

export interface DialogueNodeView {
  dialogueId: DialogueDefinition['id'];
  nodeId: string;
  speakerId: string;
  text: DialogueNode['text'];
  choices: DialogueChoiceView[];
}

export interface DialogueAdvanceResult {
  echo: EchoPersonality;
  narrative: NarrativeState;
  node: DialogueNodeView | null;
  completed: boolean;
}

function findNode(
  definition: DialogueDefinition,
  nodeId: string,
): DialogueNode | null {
  return definition.nodes.find((node) => node.id === nodeId) ?? null;
}

function toNodeView(
  definition: DialogueDefinition,
  node: DialogueNode,
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
  },
): DialogueNodeView {
  const context = makeRuleContext(params);
  return {
    dialogueId: definition.id,
    nodeId: node.id,
    speakerId: node.speakerId,
    text: node.text,
    choices: node.choices
      .filter((choice) => conditionsPass(choice.conditions ?? [], context))
      .map((choice) => ({
        id: choice.id,
        text: choice.text,
      })),
  };
}

export function startDialogue(
  definition: DialogueDefinition,
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
  },
): DialogueAdvanceResult {
  const node = findNode(definition, definition.entryNodeId);
  if (!node) {
    throw new Error(
      `${definition.id} references missing entry node ${definition.entryNodeId}`,
    );
  }

  const narrative: NarrativeState = {
    ...params.narrative,
    dialogue: {
      ...params.narrative.dialogue,
      activeDialogueId: definition.id,
      currentNodeId: node.id,
    },
  };

  return {
    echo: params.echo,
    narrative,
    node: toNodeView(definition, node, {
      ...params,
      narrative,
    }),
    completed: false,
  };
}

export function chooseDialogueOption(
  definition: DialogueDefinition,
  choiceId: string,
  params: {
    echo: EchoPersonality;
    progression: ProgressionState;
    narrative: NarrativeState;
    createdAt?: number;
  },
): DialogueAdvanceResult {
  const activeNodeId = params.narrative.dialogue.currentNodeId
    ?? definition.entryNodeId;
  const node = findNode(definition, activeNodeId);
  if (!node) {
    throw new Error(`${definition.id} current node is missing: ${activeNodeId}`);
  }

  const context = makeRuleContext(params);
  const choice = node.choices.find((item) => item.id === choiceId);
  if (!choice || !conditionsPass(choice.conditions ?? [], context)) {
    throw new Error(`${definition.id} choice is unavailable: ${choiceId}`);
  }

  const decisionId = `${definition.id}:${node.id}`;
  let narrative = recordDecision(params.narrative, {
    decisionId,
    choiceId,
    source: 'dialogue',
    createdAt: params.createdAt,
    metadata: {
      dialogueId: definition.id,
      nodeId: node.id,
    },
  });
  const applied = applyContentEffects(
    choice.effects as readonly ContentEffect[],
    makeRuleContext({
      echo: params.echo,
      progression: params.progression,
      narrative,
    }),
    'dialogue',
    params.createdAt,
  );
  narrative = applied.narrative;

  if (!choice.nextNodeId) {
    narrative = {
      ...narrative,
      dialogue: {
        activeDialogueId: null,
        currentNodeId: null,
        completedDialogueIds: [
          ...new Set([
            ...narrative.dialogue.completedDialogueIds,
            definition.id,
          ]),
        ],
      },
    };
    return {
      echo: applied.echo,
      narrative,
      node: null,
      completed: true,
    };
  }

  const nextNode = findNode(definition, choice.nextNodeId);
  if (!nextNode) {
    throw new Error(
      `${definition.id} choice ${choice.id} references missing node ${choice.nextNodeId}`,
    );
  }

  narrative = {
    ...narrative,
    dialogue: {
      ...narrative.dialogue,
      activeDialogueId: definition.id,
      currentNodeId: nextNode.id,
    },
  };

  return {
    echo: applied.echo,
    narrative,
    node: toNodeView(definition, nextNode, {
      echo: applied.echo,
      progression: params.progression,
      narrative,
    }),
    completed: false,
  };
}

