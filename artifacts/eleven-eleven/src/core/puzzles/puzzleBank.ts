/**
 * puzzleBank.ts — بنك الألغاز الموحد الجديد
 * كل لغز مصمم يدوياً مع fuzzy matching + أنواع متعددة
 */

export type PuzzleType =
  | 'numeric'
  | 'word'
  | 'reflective'
  | 'choice'
  | 'riddle'
  | 'cipher'
  | 'sequence'
  | 'pattern'
  | 'logic'
  | 'assembly';

export type PuzzlePhase =
  | 'awakening'
  | 'discovery'
  | 'connection'
  | 'truth'
  | 'fracture'
  | 'vengeance'
  | 'finale';

export interface PuzzleTemplate {
  id: string;
  act: number;
  phase: string;
  difficulty: number; // 1-10
  type: string;
  question: string;
  answers: string[];
  hints: string[];
  storyReveal: string;
  shardId?: string;
  achievementId?: string;
  xp: number;
  effects: Record<string, number>;
  context?: string;
}

// ─── FUZZY HELPERS ───────────────────────────────────────────────────
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: an + 1 }, () => Array<number>(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[an][bn];
}

function isClose(input: string, target: string): boolean {
  const a = normalize(input);
  const b = normalize(target);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  if (Math.max(a.length, b.length) <= 3) return false;
  const dist = levenshtein(a, b);
  const maxDist = Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.25));
  return dist <= maxDist;
}

function isInSynonymGroup(input: string, group: string[]): boolean {
  const a = normalize(input);
  return group.some(t => isClose(a, normalize(t)));
}

const SYNONYM_GROUPS: string[][] = [
  ['لينا', 'ليندا', 'Lina', 'lina', 'أمي', 'امي', 'mother', 'mama'],
  ['كينجا', 'Kenja', 'kenja', 'الخالق', 'الأب', 'creator', 'الأب الروحي'],
  ['إيكو', 'echo', 'الصدى', 'الابن', 'son'],
  ['صدى', 'echo', 'إيكو'],
  ['الحقيقة', 'truth', 'الحقيقة الكاملة', 'real truth'],
  ['الانتقام', 'vengeance', 'al intiqam'],
  ['التسامح', 'forgiveness', 'al tasamuh', 'الصفح'],
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
  ['الزهرة', 'flower', 'zahra'],
  ['الذاكرة', 'memory', 'zakira', 'الذكريات'],
];

export function isAnswerCorrect(puzzle: PuzzleTemplate | undefined, answer: string): boolean {
  if (!puzzle) return false;
  const normalized = normalize(answer);
  if (!normalized) return false;

  const directMatch = puzzle.answers.some(a => normalize(a) === normalized);
  if (directMatch) return true;

  for (const group of SYNONYM_GROUPS) {
    const answerMatchesGroup = puzzle.answers.some(a => isInSynonymGroup(a, group));
    const inputMatchesGroup = isInSynonymGroup(answer, group);
    if (answerMatchesGroup && inputMatchesGroup) return true;
  }

  for (const a of puzzle.answers) {
    const normalizedA = normalize(a);
    if (normalizedA.length >= 2 && normalized.includes(normalizedA)) return true;
    const wordsAnswer = normalized.split(' ');
    const wordsA = normalizedA.split(' ');
    if (wordsA.some(w => w.length >= 2 && wordsAnswer.includes(w))) return true;
  }

  if (puzzle.answers.some(a => isClose(answer, a))) return true;

  return false;
}

// ─── BANK ───────────────────────────────────────────────────────────
import { BATCH_1 } from './batch_01';

export const PUZZLE_BANK: PuzzleTemplate[] = [BATCH_1].flat();

export function clearBank(): void {
  PUZZLE_BANK.length = 0;
}

export function addToBank(puzzles: PuzzleTemplate[]): void {
  PUZZLE_BANK.push(...puzzles);
}

export function getAllPuzzles(): PuzzleTemplate[] {
  return PUZZLE_BANK;
}

export function getPuzzleByNumber(puzzleNumber: number): PuzzleTemplate | undefined {
  if (puzzleNumber < 1) return undefined;
  return PUZZLE_BANK[puzzleNumber - 1];
}
