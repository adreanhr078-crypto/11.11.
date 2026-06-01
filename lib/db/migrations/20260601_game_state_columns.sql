-- Migration applied 2026-06-01 via executeSql
-- Task #35: Sync GameState to DB across devices

-- Add game state columns to the users table
-- IF NOT EXISTS ensures idempotency — safe to run again on fresh envs
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_state_fear INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_state_curiosity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_state_trust_ai INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_state_level INTEGER NOT NULL DEFAULT 1;
