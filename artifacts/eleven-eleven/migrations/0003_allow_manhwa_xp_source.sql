PRAGMA foreign_keys = OFF;

-- Migration 0001 created this CHECK constraint before Manhwa chapter rewards
-- were part of the approved progression contract. Rebuild only this ledger
-- table so existing append-only events remain intact and the new source can be
-- recorded by the server validator.
CREATE TABLE xp_reward_events_v3 (
  user_id TEXT NOT NULL,
  reward_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'puzzle',
    'manhwa',
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

INSERT INTO xp_reward_events_v3 (
  user_id,
  reward_key,
  source_type,
  source_id,
  xp_amount,
  granted_at
)
SELECT
  user_id,
  reward_key,
  source_type,
  source_id,
  xp_amount,
  granted_at
FROM xp_reward_events;

DROP TABLE xp_reward_events;
ALTER TABLE xp_reward_events_v3 RENAME TO xp_reward_events;

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
