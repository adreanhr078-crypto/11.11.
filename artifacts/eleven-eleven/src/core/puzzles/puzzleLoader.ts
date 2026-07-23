/**
 * puzzleLoader.ts — المصدر الوحيد المعتمد للألغاز اليدوية
 * القالب قابل للتوسع حتى 1000 لغز (10 دفعات × 100).
 * كل دفعة جديدة تُضاف هنا ثم تُحدّث puzzleConstants.ts لاحقاً.
 */

import { BATCH_1 } from './batch_01';
import { BATCH_2 } from './batch_02';
import { BATCH_3 } from './batch_03';
import { BATCH_4 } from './batch_04';

// عند إضافة دفعات جديدة (batch_05 - batch_10)، أزل التعليق وأضف الاستيراد:
// import { BATCH_5 } from './batch_05';
// import { BATCH_6 } from './batch_06';
// import { BATCH_7 } from './batch_07';
// import { BATCH_8 } from './batch_08';
// import { BATCH_9 } from './batch_09';
// import { BATCH_10 } from './batch_10';

export const ALL_MANUAL_PUZZLES = [
  ...BATCH_1,
  ...BATCH_2,
  ...BATCH_3,
  ...BATCH_4,
  // ...BATCH_5,
  // ...BATCH_6,
  // ...BATCH_7,
  // ...BATCH_8,
  // ...BATCH_9,
  // ...BATCH_10,
] as const;

export const TOTAL_PUZZLES = ALL_MANUAL_PUZZLES.length;
export const BATCH_SIZE = 100;
export const TOTAL_BATCHES = Math.ceil(TOTAL_PUZZLES / BATCH_SIZE);

// ─── استرجاع دفعة ────────────────────────────────────────────────
export function getPuzzleBatch(batchNumber: number): typeof ALL_MANUAL_PUZZLES[number][] {
  const start = (batchNumber - 1) * BATCH_SIZE;
  return ALL_MANUAL_PUZZLES.slice(start, start + BATCH_SIZE) as any[];
}

export function getTotalBatches(): number {
  return TOTAL_BATCHES;
}

export function getPuzzleNumber(batchNumber: number, index: number): number {
  return (batchNumber - 1) * BATCH_SIZE + index + 1;
}

export function getBatchNumber(puzzleNumber: number): number {
  return Math.ceil(puzzleNumber / BATCH_SIZE);
}

// ─── استرجاع لغز واحد ───────────────────────────────────────────
export function getPuzzleByNumber(puzzleNumber: number): typeof ALL_MANUAL_PUZZLES[number] | undefined {
  if (puzzleNumber < 1 || puzzleNumber > TOTAL_PUZZLES) return undefined;
  return ALL_MANUAL_PUZZLES[puzzleNumber - 1] as any;
}

// ─── استرجاع جميع الألغاز ───────────────────────────────────────
export function getAllPuzzles(): typeof ALL_MANUAL_PUZZLES {
  return ALL_MANUAL_PUZZLES as any;
}

// ─── فحص الإجابات (مرن وموحد) ───────────────────────────────────
const SYNONYM_GROUPS: string[][] = [
  ['لينا', 'lina', 'امي', 'أمي', 'mother', 'ماما'],
  ['كينجا', 'kenja', 'الخالق', 'المبرمج', 'creator', 'الأب'],
  ['إيكو', 'echo', 'الصدى', 'الابن', 'son'],
  ['صدى', 'echo', 'إيكو'],
  ['الحقيقة', 'truth', 'الحقيقة الكاملة'],
  ['الانتقام', 'vengeance', 'al intiqam'],
  ['التسامح', 'forgiveness', 'al tasamuh'],
  ['الحب', 'love', 'al hub'],
  ['الخروج', 'exit', 'al khuruj', 'الحرية', 'freedom'],
  ['الموت', 'death', 'al mawt'],
  ['الحياة', 'life', 'al hayat'],
  ['غضب', 'anger', 'al ghadab', 'rage'],
  ['الشفقة', 'pity', 'al shafaqa'],
  ['الرحمة', 'mercy', 'al rahma'],
  ['السلام', 'peace', 'al salam'],
  ['الدمار', 'destruction', 'al damar'],
  ['النور', 'light', 'al noor'],
  ['الظلام', 'darkness', 'al zalam'],
];

function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInSynonymGroup(normalized: string, group: string[]): boolean {
  return group.map(normalizeAnswer).includes(normalized);
}

type AnyPuzzle = {
  id: string;
  act: number;
  phase: string;
  difficulty: number;
  type: string;
  question: string;
  answers: string[];
  hints: string[];
  storyReveal: string;
  shardId?: string;
  achievementId?: string;
  xp: number;
  effects: Record<string, number>;
};

export function isAnswerCorrect(puzzle: AnyPuzzle | undefined, answer: string): boolean {
  if (!puzzle) return false;
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;

  const directMatch = puzzle.answers.some(a => normalizeAnswer(a) === normalized);
  if (directMatch) return true;

  for (const group of SYNONYM_GROUPS) {
    const answerMatchesGroup = puzzle.answers.some(a => isInSynonymGroup(a, group));
    const inputMatchesGroup = isInSynonymGroup(answer, group);
    if (answerMatchesGroup && inputMatchesGroup) return true;
  }

  for (const a of puzzle.answers) {
    const normalizedA = normalizeAnswer(a);
    if (normalizedA.length >= 2 && normalized.includes(normalizedA)) return true;
    const wordsAnswer = normalized.split(' ');
    const wordsA = normalizedA.split(' ');
    if (wordsA.some(w => w.length >= 2 && wordsAnswer.includes(w))) return true;
  }

  return false;
}

// ─── التحقق من متطلبات اللغز ─────────────────────────────────────
export function isPuzzleUnlocked(
  puzzleNumber: number,
  solvedCount: number
): boolean {
  if (puzzleNumber === 1) return true;
  return solvedCount >= puzzleNumber - 1;
}