PRAGMA foreign_keys = ON;

-- Optional Memory Reconstruction is a verified collection action. The
-- reconstruction receipt is append-only and can never grant twice.
CREATE TABLE IF NOT EXISTS player_memory_reconstruction_events (
  user_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL CHECK (chapter_id IN (
    'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'
  )),
  reconstructed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, chapter_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TRIGGER IF NOT EXISTS prevent_memory_reconstruction_update
BEFORE UPDATE ON player_memory_reconstruction_events
BEGIN
  SELECT RAISE(ABORT, 'player_memory_reconstruction_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_memory_reconstruction_delete
BEFORE DELETE ON player_memory_reconstruction_events
BEGIN
  SELECT RAISE(ABORT, 'player_memory_reconstruction_events is append-only');
END;

-- Unlocks are server-derived from verified Story Puzzle, Manhwa, Canon and
-- collection receipts. The source key makes retries idempotent.
CREATE TABLE IF NOT EXISTS player_achievement_unlock_events (
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, achievement_id),
  UNIQUE (user_id, source_event_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_achievement_unlock_player
  ON player_achievement_unlock_events(user_id, unlocked_at ASC, achievement_id ASC);

CREATE TRIGGER IF NOT EXISTS prevent_achievement_unlock_update
BEFORE UPDATE ON player_achievement_unlock_events
BEGIN
  SELECT RAISE(ABORT, 'player_achievement_unlock_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_achievement_unlock_delete
BEFORE DELETE ON player_achievement_unlock_events
BEGIN
  SELECT RAISE(ABORT, 'player_achievement_unlock_events is append-only');
END;

CREATE TABLE IF NOT EXISTS player_cosmetic_ownership (
  user_id TEXT NOT NULL,
  cosmetic_id TEXT NOT NULL,
  cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN (
    'title', 'frame', 'badge', 'avatar-effect', 'system-border'
  )),
  source_achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, cosmetic_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_cosmetic_ownership_player
  ON player_cosmetic_ownership(user_id, cosmetic_type, unlocked_at ASC);

CREATE TRIGGER IF NOT EXISTS prevent_cosmetic_ownership_update
BEFORE UPDATE ON player_cosmetic_ownership
BEGIN
  SELECT RAISE(ABORT, 'player_cosmetic_ownership is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_cosmetic_ownership_delete
BEFORE DELETE ON player_cosmetic_ownership
BEGIN
  SELECT RAISE(ABORT, 'player_cosmetic_ownership is append-only');
END;

-- Equipped cosmetics are mutable presentation preferences. Every selection
-- is validated against ownership by the server before this table is written.
CREATE TABLE IF NOT EXISTS player_equipped_cosmetics (
  user_id TEXT NOT NULL,
  cosmetic_type TEXT NOT NULL CHECK (cosmetic_type IN (
    'title', 'frame', 'badge', 'avatar-effect', 'system-border'
  )),
  cosmetic_id TEXT NOT NULL,
  equipped_at TEXT NOT NULL,
  PRIMARY KEY (user_id, cosmetic_type),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_equipped_cosmetics_player
  ON player_equipped_cosmetics(user_id, cosmetic_type);

