/**
 * puzzleLoader.ts — Compatibility layer + batch registration
 * Source of truth for puzzles is puzzleBank.ts
 */

import {
  addToBank,
  getAllPuzzles as getBankPuzzles,
  isAnswerCorrect,
  type PuzzleTemplate,
} from './puzzleBank';

// ─── App-facing API ──────────────────────────────────────────────────
export { isAnswerCorrect };

export function registerPuzzleBatch(puzzles: PuzzleTemplate[]): void {
  addToBank(puzzles);
}

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
