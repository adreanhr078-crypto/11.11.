/**
 * puzzleLoader.ts — Compatibility layer + batch registration
 * Source of truth for puzzles is puzzleBank.ts
 */

import {
  addToBank,
  clearBank,
  getAllPuzzles as getBankPuzzles,
  isAnswerCorrect,
  type PuzzleTemplate,
} from './puzzleBank';
import { BATCH_1 } from './batch_01';

// register batches into the bank on import
clearBank();
addToBank(BATCH_1);

// ─── App-facing API ──────────────────────────────────────────────────
export { isAnswerCorrect };

export function getAllPuzzles(): PuzzleTemplate[] {
  return getBankPuzzles();
}

export function getPuzzleByNumber(puzzleNumber: number): PuzzleTemplate | undefined {
  if (puzzleNumber < 1) return undefined;
  return getBankPuzzles()[puzzleNumber - 1];
}

export function isPuzzleUnlocked(puzzleNumber: number, solvedCount: number): boolean {
  if (puzzleNumber === 1) return true;
  return solvedCount >= puzzleNumber - 1;
}
