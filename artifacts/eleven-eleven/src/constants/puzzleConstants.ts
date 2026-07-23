/**
 * Shared puzzle progression constants for 11.11 Echo Mind Game
 * Centralizes constants used for story acts, puzzle loading, achievement checks,
 * and memory-shard calculations.
 *
 * Target state: 1000 manual puzzles across 10 batches, with 1000 memory shards.
 */

// ─── Puzzle Counts ────────────────────────────────────────────────────
export const ORIGINAL_PUZZLE_COUNT = 1000;
export const TOTAL_PUZZLES = ORIGINAL_PUZZLE_COUNT;
export const TOTAL_MEMORY_SHARDS = TOTAL_PUZZLES;

// ─── Batch Layout ─────────────────────────────────────────────────────
export const BATCH_SIZE = 100;
export const TOTAL_BATCHES = 10;

// ─── Arc Ranges ───────────────────────────────────────────────────────
export const ACT1_START = 1;
export const ACT1_END = 100;

export const ACT2_START = 101;
export const ACT2_END = 250;

export const ACT3_START = 251;
export const ACT3_END = 400;

export const ACT4_START = 401;
export const ACT4_END = 550;

export const ACT5_START = 551;
export const ACT5_END = 700;

export const ACT6_START = 701;
export const ACT6_END = 850;

export const ACT7_START = 851;
export const ACT7_END = 1000;

// ─── Arc Puzzle Totals ────────────────────────────────────────────────
export const ACT1_PUZZLE_COUNT = ACT1_END - ACT1_START + 1; // 100
export const ACT2_PUZZLE_COUNT = ACT2_END - ACT2_START + 1; // 150
export const ACT3_PUZZLE_COUNT = ACT3_END - ACT3_START + 1; // 150
export const ACT4_PUZZLE_COUNT = ACT4_END - ACT4_START + 1; // 150
export const ACT5_PUZZLE_COUNT = ACT5_END - ACT5_START + 1; // 150
export const ACT6_PUZZLE_COUNT = ACT6_END - ACT6_START + 1; // 150
export const ACT7_PUZZLE_COUNT = ACT7_END - ACT7_START + 1; // 150

export const ALL_ACTS = [1, 2, 3, 4, 5, 6, 7] as const;
export type ActNumber = typeof ALL_ACTS[number];
