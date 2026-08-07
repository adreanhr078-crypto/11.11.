PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player_progression (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS xp_reward_events (
  user_id TEXT NOT NULL,
  reward_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'puzzle',
    'story',
    'secret',
    'achievement',
    'daily_trial',
    'online_chess'
  )),
  source_id TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  granted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, reward_key),
  FOREIGN KEY (user_id)
    REFERENCES player_progression(user_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_progression_ranking
  ON player_progression(total_xp DESC, created_at ASC, user_id ASC);

CREATE INDEX IF NOT EXISTS idx_xp_reward_events_player
  ON xp_reward_events(user_id, granted_at DESC);
