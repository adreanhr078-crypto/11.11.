CREATE TABLE IF NOT EXISTS player_username_reservations (
  normalized_username TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS player_memory_fragment_events (
  user_id TEXT NOT NULL,
  fragment_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('puzzle', 'manhwa', 'story_event')),
  source_id TEXT NOT NULL,
  found_at TEXT NOT NULL,
  PRIMARY KEY (user_id, fragment_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS player_profile_stats (
  user_id TEXT PRIMARY KEY,
  chapters_completed INTEGER NOT NULL DEFAULT 0 CHECK (chapters_completed >= 0),
  puzzles_solved INTEGER NOT NULL DEFAULT 0 CHECK (puzzles_solved >= 0),
  secrets_found INTEGER NOT NULL DEFAULT 0 CHECK (secrets_found >= 0),
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_username_reservations_user
  ON player_username_reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_player_memory_fragment_events_user
  ON player_memory_fragment_events(user_id, found_at DESC);

CREATE TRIGGER IF NOT EXISTS prevent_xp_reward_event_update
BEFORE UPDATE ON xp_reward_events
BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_xp_reward_event_delete
BEFORE DELETE ON xp_reward_events
BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_memory_fragment_event_update
BEFORE UPDATE ON player_memory_fragment_events
BEGIN
  SELECT RAISE(ABORT, 'player_memory_fragment_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_memory_fragment_event_delete
BEFORE DELETE ON player_memory_fragment_events
BEGIN
  SELECT RAISE(ABORT, 'player_memory_fragment_events is append-only');
END;
