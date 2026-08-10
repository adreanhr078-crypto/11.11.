PRAGMA foreign_keys = OFF;

-- 0008 introduced the live ledgers. This follow-up keeps deployments that
-- already applied 0008 safe while adding a distinct, auditable weekly XP
-- source instead of silently dropping the weekly reward on CHECK failure.
CREATE TABLE xp_reward_events_v9 (
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

INSERT INTO xp_reward_events_v9
SELECT user_id, reward_key, source_type, source_id, xp_amount, granted_at
FROM xp_reward_events;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_update;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_delete;
DROP TABLE xp_reward_events;
ALTER TABLE xp_reward_events_v9 RENAME TO xp_reward_events;
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

PRAGMA foreign_keys = ON;
