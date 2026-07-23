// @deprecated Preserved pre-Phase-1 test. It referenced missing puzzle batches.
import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, getPuzzleByNumber, TOTAL_PUZZLES } from '../core/puzzles/puzzleLoader';

describe('puzzleLoader — Manual Puzzle System', () => {
  it('loads first puzzle from batch_01', () => {
    const p = getPuzzleByNumber(1);
    expect(p).toBeDefined();
    expect(p!.id).toBe('puzzle_001');
    expect(p!.question.length).toBeGreaterThan(0);
  });

  it('loads first puzzle from batch_02', () => {
    const p = getPuzzleByNumber(101);
    expect(p).toBeDefined();
    expect(p!.id).toBe('puzzle_101');
    expect(p!.question.length).toBeGreaterThan(0);
  });

  it('loads first puzzle from batch_03', () => {
    const p = getPuzzleByNumber(201);
    expect(p).toBeDefined();
    expect(p!.id).toBe('puzzle_201');
    expect(p!.question.length).toBeGreaterThan(0);
  });

  it('loads first puzzle from batch_04', () => {
    const p = getPuzzleByNumber(301);
    expect(p).toBeDefined();
    expect(p!.id).toBe('puzzle_301');
    expect(p!.question.length).toBeGreaterThan(0);
  });

  it('loads last puzzle from batch_04', () => {
    const p = getPuzzleByNumber(400);
    expect(p).toBeDefined();
    expect(p!.id).toBe('puzzle_400');
  });

  it('returns undefined for out-of-range puzzles', () => {
    expect(getPuzzleByNumber(0)).toBeUndefined();
    expect(getPuzzleByNumber(401)).toBeUndefined();
  });

  it('has exactly 400 manual puzzles total', () => {
    expect(TOTAL_PUZZLES).toBe(400);
  });

  it('recognizes synonym answers', () => {
    const puzzle = getPuzzleByNumber(12)!; // "ما اسم المرأة..." → إجابة: لينا
    expect(isAnswerCorrect(puzzle, 'لينا')).toBe(true);
    expect(isAnswerCorrect(puzzle, 'mama')).toBe(true);
    expect(isAnswerCorrect(puzzle, 'missing')).toBe(false);
  });

  it('recognizes numeric answers', () => {
    const puzzle = getPuzzleByNumber(1)!; // "كم باباً..." → إجابة: 1
    expect(isAnswerCorrect(puzzle, '1')).toBe(true);
    expect(isAnswerCorrect(puzzle, 'واحد')).toBe(true);
  });

  it('loads all 400 manual puzzles without gap', () => {
    const puzzles = Array.from({ length: 400 }, (_, i) => getPuzzleByNumber(i + 1));
    expect(puzzles.every(p => p !== undefined)).toBe(true);
  });

  it('each puzzle has required fields', () => {
    for (let i = 1; i <= 400; i++) {
      const p = getPuzzleByNumber(i)!;
      expect(p.id).toBe(`puzzle_${String(i).padStart(3, '0')}`);
      expect(p.question.length).toBeGreaterThan(0);
      expect(p.answers.length).toBeGreaterThan(0);
      expect(p.hints.length).toBe(3);
      expect(p.storyReveal.length).toBeGreaterThan(0);
      expect(p.xp).toBeGreaterThan(0);
    }
  });
});    }
  });
});
