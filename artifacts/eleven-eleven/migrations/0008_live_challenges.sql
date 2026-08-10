PRAGMA foreign_keys = OFF;

-- Add a first-class weekly live source while preserving the immutable XP
-- ledger. Existing event rows are copied byte-for-byte.
CREATE TABLE xp_reward_events_v8 (
  user_id TEXT NOT NULL,
  reward_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'puzzle', 'manhwa', 'story', 'secret', 'achievement',
    'daily_trial', 'weekly_trial', 'online_chess'
  )),
  source_id TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  granted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, reward_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);
INSERT INTO xp_reward_events_v8
SELECT user_id, reward_key, source_type, source_id, xp_amount, granted_at
FROM xp_reward_events;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_update;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_delete;
DROP TABLE xp_reward_events;
ALTER TABLE xp_reward_events_v8 RENAME TO xp_reward_events;
CREATE INDEX idx_xp_reward_events_player
  ON xp_reward_events(user_id, granted_at DESC);
CREATE TRIGGER prevent_xp_reward_event_update
BEFORE UPDATE ON xp_reward_events
BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;
CREATE TRIGGER prevent_xp_reward_event_delete
BEFORE DELETE ON xp_reward_events
BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;

-- Live rewards use the existing XP and coin ledgers. Extend the coin source
-- contract without changing any existing receipts.
CREATE TABLE player_coin_events_v8 (
  user_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'story_puzzle_reward', 'story_puzzle_perfect', 'story_puzzle_hint',
    'daily_trial', 'weekly_trial'
  )),
  source_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount != 0),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

INSERT INTO player_coin_events_v8
SELECT user_id, event_key, source_type, source_id, amount, recorded_at
FROM player_coin_events;
DROP TRIGGER IF EXISTS prevent_player_coin_event_update;
DROP TRIGGER IF EXISTS prevent_player_coin_event_delete;
DROP TRIGGER IF EXISTS enforce_story_puzzle_hint_balance;
DROP TRIGGER IF EXISTS record_story_puzzle_hint_spend;
DROP TABLE player_coin_events;
ALTER TABLE player_coin_events_v8 RENAME TO player_coin_events;
CREATE INDEX idx_player_coin_events_player
  ON player_coin_events(user_id, recorded_at ASC, event_key ASC);
CREATE TRIGGER prevent_player_coin_event_update
BEFORE UPDATE ON player_coin_events
BEGIN
  SELECT RAISE(ABORT, 'player_coin_events is append-only');
END;
CREATE TRIGGER prevent_player_coin_event_delete
BEFORE DELETE ON player_coin_events
BEGIN
  SELECT RAISE(ABORT, 'player_coin_events is append-only');
END;

-- Preserve the existing Story Puzzle hint debit contract after the ledger
-- rebuild above.
CREATE TRIGGER enforce_story_puzzle_hint_balance
BEFORE INSERT ON player_story_puzzle_hint_events
FOR EACH ROW WHEN NEW.coin_cost > 0
BEGIN
  SELECT RAISE(ABORT, 'insufficient verified coins')
  WHERE (
    SELECT COALESCE(SUM(amount), 0) FROM player_coin_events
    WHERE user_id = NEW.user_id
  ) < NEW.coin_cost;
END;
CREATE TRIGGER record_story_puzzle_hint_spend
AFTER INSERT ON player_story_puzzle_hint_events
FOR EACH ROW WHEN NEW.coin_cost > 0
BEGIN
  INSERT INTO player_coin_events (
    user_id, event_key, source_type, source_id, amount, recorded_at
  ) VALUES (
    NEW.user_id,
    NEW.puzzle_id || ':hint:' || NEW.hint_index || ':v1',
    'story_puzzle_hint', NEW.puzzle_id, -NEW.coin_cost, NEW.unlocked_at
  );
END;

CREATE TABLE IF NOT EXISTS live_challenge_definitions (
  challenge_id TEXT PRIMARY KEY,
  challenge_kind TEXT NOT NULL CHECK (challenge_kind IN ('daily', 'weekly')),
  period_key TEXT NOT NULL,
  challenge_version TEXT NOT NULL,
  mechanic TEXT NOT NULL,
  public_definition_json TEXT NOT NULL,
  solution_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_challenge_definitions_period
  ON live_challenge_definitions(challenge_kind, period_key);

CREATE TABLE IF NOT EXISTS live_player_daily_attempts (
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  period_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'in_progress', 'completed')),
  draft_json TEXT NOT NULL DEFAULT '{}',
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0 AND hints_used <= 3),
  perfect_solve INTEGER NOT NULL DEFAULT 0 CHECK (perfect_solve IN (0, 1)),
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, challenge_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (challenge_id) REFERENCES live_challenge_definitions(challenge_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_live_daily_attempts_player_period
  ON live_player_daily_attempts(user_id, period_key DESC);

CREATE TABLE IF NOT EXISTS live_player_weekly_progress (
  user_id TEXT NOT NULL,
  week_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'in_progress', 'completed')),
  current_stage INTEGER NOT NULL DEFAULT 0 CHECK (current_stage >= 0 AND current_stage <= 5),
  completed_stages INTEGER NOT NULL DEFAULT 0 CHECK (completed_stages >= 0 AND completed_stages <= 5),
  draft_json TEXT NOT NULL DEFAULT '{}',
  hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, week_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS live_challenge_hint_events (
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  hint_index INTEGER NOT NULL CHECK (hint_index BETWEEN 0 AND 2),
  coin_cost INTEGER NOT NULL CHECK (coin_cost >= 0),
  used_at TEXT NOT NULL,
  PRIMARY KEY (user_id, challenge_id, hint_index),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (challenge_id) REFERENCES live_challenge_definitions(challenge_id) ON DELETE RESTRICT
);

CREATE TRIGGER prevent_live_hint_update
BEFORE UPDATE ON live_challenge_hint_events
BEGIN
  SELECT RAISE(ABORT, 'live_challenge_hint_events is append-only');
END;
CREATE TRIGGER prevent_live_hint_delete
BEFORE DELETE ON live_challenge_hint_events
BEGIN
  SELECT RAISE(ABORT, 'live_challenge_hint_events is append-only');
END;

CREATE TRIGGER enforce_live_hint_balance
BEFORE INSERT ON live_challenge_hint_events
FOR EACH ROW WHEN NEW.coin_cost > 0
BEGIN
  SELECT RAISE(ABORT, 'insufficient verified coins')
  WHERE (
    SELECT COALESCE(SUM(amount), 0) FROM player_coin_events
    WHERE user_id = NEW.user_id
  ) < NEW.coin_cost;
END;

CREATE TRIGGER record_live_hint_spend
AFTER INSERT ON live_challenge_hint_events
FOR EACH ROW WHEN NEW.coin_cost > 0
BEGIN
  INSERT INTO player_coin_events (
    user_id, event_key, source_type, source_id, amount, recorded_at
  ) VALUES (
    NEW.user_id,
    NEW.challenge_id || ':hint:' || NEW.hint_index || ':v1',
    CASE WHEN (
      SELECT challenge_kind FROM live_challenge_definitions
      WHERE challenge_id = NEW.challenge_id
    ) = 'weekly' THEN 'weekly_trial' ELSE 'daily_trial' END,
    NEW.challenge_id, -NEW.coin_cost, NEW.used_at
  );
END;

CREATE TABLE IF NOT EXISTS live_challenge_reward_events (
  user_id TEXT NOT NULL,
  reward_key TEXT NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('daily', 'weekly', 'weekly-recovery', 'weekly-perfect')),
  source_id TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  coin_amount INTEGER NOT NULL CHECK (coin_amount > 0),
  perfect_solve INTEGER NOT NULL DEFAULT 0 CHECK (perfect_solve IN (0, 1)),
  rewarded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, reward_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TRIGGER prevent_live_reward_update
BEFORE UPDATE ON live_challenge_reward_events
BEGIN
  SELECT RAISE(ABORT, 'live_challenge_reward_events is append-only');
END;
CREATE TRIGGER prevent_live_reward_delete
BEFORE DELETE ON live_challenge_reward_events
BEGIN
  SELECT RAISE(ABORT, 'live_challenge_reward_events is append-only');
END;

PRAGMA foreign_keys = ON;
