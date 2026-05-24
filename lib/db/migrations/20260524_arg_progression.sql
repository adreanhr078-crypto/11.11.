-- Migration applied 2026-05-24 via executeSql
-- Task #21: ARG Progression System

-- New columns added to the existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_unlocked_at TEXT NOT NULL DEFAULT '{}';

-- Backfill from Task #15 that had schema but no migration applied
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fear TEXT;
