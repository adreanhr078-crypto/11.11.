import type { PuzzleEffects } from '../../core/puzzleTypes';
import {
  addToBank,
  clearBank,
  type PuzzleTemplate,
} from '../../core/puzzles/puzzleBank';
import type {
  ContentEffect,
  PuzzleDefinition,
} from '../../domain/content/contracts';
import {
  CHAPTER_DEFINITIONS,
  PUZZLE_DEFINITIONS,
} from './contentRegistry';

const phases = [
  'awakening',
  'discovery',
  'connection',
  'truth',
  'fracture',
  'vengeance',
  'finale',
] as const;

function toLegacyEffects(effects: ContentEffect[]): PuzzleEffects {
  const legacy: PuzzleEffects = {};
  for (const effect of effects) {
    if (effect.kind !== 'adjustStat') continue;
    switch (effect.stat) {
      case 'humanity':
        legacy.hope = (legacy.hope ?? 0) + effect.amount;
        break;
      case 'trust':
        legacy.trust = (legacy.trust ?? 0) + effect.amount;
        break;
      case 'fear':
        legacy.fear = (legacy.fear ?? 0) + effect.amount;
        break;
      case 'anger':
        legacy.rageEffect = (legacy.rageEffect ?? 0) + effect.amount;
        break;
      case 'corruption':
        legacy.corruption = (legacy.corruption ?? 0) + effect.amount;
        break;
      case 'memoriesRecovered':
        legacy.memoryStability = (
          legacy.memoryStability ?? 0
        ) + effect.amount;
        break;
      case 'sadness':
        break;
    }
  }
  return legacy;
}

function toLegacyPuzzle(definition: PuzzleDefinition): PuzzleTemplate {
  const chapter = CHAPTER_DEFINITIONS.find(
    ({ id }) => id === definition.chapterId,
  );
  if (!chapter) {
    throw new Error(`${definition.id} references unknown chapter`);
  }
  return {
    id: definition.id,
    act: chapter.order,
    phase: phases[chapter.order - 1] ?? 'finale',
    difficulty: definition.difficulty,
    type: definition.type,
    question: definition.prompt.ar,
    answers: definition.acceptedAnswers,
    hints: definition.hints.map(({ ar }) => ar),
    storyReveal: definition.storyReveal.ar,
    shardId: definition.memoryId,
    xp: Math.max(1, definition.difficulty * 10),
    effects: toLegacyEffects(definition.effects),
  };
}

export function registerAuthoredPuzzleContent(): number {
  clearBank();
  const puzzles = PUZZLE_DEFINITIONS.map(toLegacyPuzzle);
  addToBank(puzzles);
  return puzzles.length;
}
