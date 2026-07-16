/**
 * Shared puzzle progression constants for 11.11 Echo Mind Game
 * Centralizes magic numbers used across puzzle generation, achievement checks,
 * character evolution, and memory-shard calculations.
 */

// ─── Puzzle Counts ────────────────────────────────────────────────────
export const ORIGINAL_PUZZLE_COUNT = 219;
export const TOTAL_PUZZLES = 1000;

// ─── Arc Ranges ───────────────────────────────────────────────────────
export const PRELUDE_START = 220;
export const PRELUDE_END = 333;

export const FRACTURE_START = 334;
export const FRACTURE_END = 500;

export const ARCHITECT_START = 501;
export const ARCHITECT_END = 666;

export const SIGNAL_START = 667;
export const SIGNAL_END = 888;

export const FINAL_START = 889;
export const FINAL_END = 1000;

// ─── Arc Puzzle Totals ────────────────────────────────────────────────
export const PRELUDE_PUZZLE_COUNT = PRELUDE_END - PRELUDE_START + 1; // 114
export const FRACTURE_PUZZLE_COUNT = FRACTURE_END - FRACTURE_START + 1; // 167
export const ARCHITECT_PUZZLE_COUNT = ARCHITECT_END - ARCHITECT_START + 1; // 166
export const SIGNAL_PUZZLE_COUNT = SIGNAL_END - SIGNAL_START + 1; // 222
export const FINAL_PUZZLE_COUNT = FINAL_END - FINAL_START + 1; // 112

// ─── Memory Shard Reference ───────────────────────────────────────────
export const TOTAL_MEMORY_SHARDS = 219;
