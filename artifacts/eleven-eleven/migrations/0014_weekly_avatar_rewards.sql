PRAGMA foreign_keys = ON;

-- Rare character avatars are account-owned rewards. The append-only ledger
-- prevents presentation code from manufacturing ownership and makes weekly
-- completion retries idempotent.
CREATE TABLE IF NOT EXISTS player_avatar_unlock_events (
  user_id TEXT NOT NULL,
  avatar_id TEXT NOT NULL CHECK (avatar_id IN (
    'rare_yuki', 'rare_nara', 'rare_kenja', 'rare_lina', 'rare_zero'
  )),
  source_type TEXT NOT NULL CHECK (source_type = 'weekly_trial'),
  source_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, avatar_id),
  UNIQUE (user_id, source_type, source_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_avatar_unlock_player
  ON player_avatar_unlock_events(user_id, unlocked_at ASC, avatar_id ASC);

CREATE TRIGGER IF NOT EXISTS prevent_player_avatar_unlock_update
BEFORE UPDATE ON player_avatar_unlock_events
BEGIN
  SELECT RAISE(ABORT, 'player_avatar_unlock_events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_avatar_unlock_delete
BEFORE DELETE ON player_avatar_unlock_events
BEGIN
  SELECT RAISE(ABORT, 'player_avatar_unlock_events is append-only');
END;
