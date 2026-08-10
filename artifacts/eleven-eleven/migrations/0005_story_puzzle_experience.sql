PRAGMA foreign_keys = ON;

-- The official Phase 3 campaign keeps immutable completion, hint, discovery,
-- coin, XP, and fragment receipts separate from the one mutable draft save.
CREATE TABLE IF NOT EXISTS player_story_puzzle_completion_events (
  user_id TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL CHECK (chapter_id IN (
    'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'
  )),
  classification TEXT NOT NULL CHECK (classification IN ('main', 'secret')),
  source_page_id TEXT NOT NULL,
  source_page_number INTEGER NOT NULL CHECK (
    source_page_number >= 3 AND source_page_number <= 69
  ),
  perfect_solve INTEGER NOT NULL DEFAULT 0 CHECK (perfect_solve IN (0, 1)),
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_story_puzzle_completion_player
  ON player_story_puzzle_completion_events(user_id, completed_at ASC, puzzle_id ASC);

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_completion_update
BEFORE UPDATE ON player_story_puzzle_completion_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_completion_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_completion_delete
BEFORE DELETE ON player_story_puzzle_completion_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_completion_events is append-only');
END;

CREATE TABLE IF NOT EXISTS player_story_puzzle_discovery_events (
  user_id TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_discovery_update
BEFORE UPDATE ON player_story_puzzle_discovery_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_discovery_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_discovery_delete
BEFORE DELETE ON player_story_puzzle_discovery_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_discovery_events is append-only');
END;

CREATE TABLE IF NOT EXISTS player_story_puzzle_hint_events (
  user_id TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  hint_index INTEGER NOT NULL CHECK (hint_index BETWEEN 0 AND 2),
  coin_cost INTEGER NOT NULL CHECK (coin_cost >= 0),
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_id, hint_index),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_story_puzzle_hint_player
  ON player_story_puzzle_hint_events(user_id, puzzle_id, hint_index);

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_hint_update
BEFORE UPDATE ON player_story_puzzle_hint_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_hint_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_story_puzzle_hint_delete
BEFORE DELETE ON player_story_puzzle_hint_events
BEGIN
  SELECT RAISE(ABORT, 'player_story_puzzle_hint_events is append-only');
END;

CREATE TABLE IF NOT EXISTS player_coin_events (
  user_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'story_puzzle_reward', 'story_puzzle_perfect', 'story_puzzle_hint'
  )),
  source_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount != 0),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_coin_events_player
  ON player_coin_events(user_id, recorded_at ASC, event_key ASC);

CREATE TRIGGER IF NOT EXISTS prevent_player_coin_event_update
BEFORE UPDATE ON player_coin_events
BEGIN
  SELECT RAISE(ABORT, 'player_coin_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_coin_event_delete
BEFORE DELETE ON player_coin_events
BEGIN
  SELECT RAISE(ABORT, 'player_coin_events is append-only');
END;

-- Draft progress has no reward semantics and is intentionally the only
-- mutable puzzle record. It is safe to resume Puzzle 15 and Puzzle 20 after
-- a reload without changing any immutable progression ledger.
CREATE TABLE IF NOT EXISTS player_story_puzzle_progress (
  user_id TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  stage_index INTEGER NOT NULL DEFAULT 0 CHECK (stage_index >= 0),
  progress_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_story_puzzle_progress_player
  ON player_story_puzzle_progress(user_id, updated_at DESC);
