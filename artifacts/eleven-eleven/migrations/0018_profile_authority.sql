PRAGMA foreign_keys = ON;

-- Firestore remains a player-scoped cache for cloud-save compatibility.  This
-- table is the authoritative source for mutable profile choices: all reads and
-- writes that influence the live product now pass through the Pages API and
-- this D1 row.  A browser write to Firestore can no longer equip an unearned
-- avatar or alter the profile seen by the game.
CREATE TABLE IF NOT EXISTS player_profile_authority (
  user_id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_id TEXT NOT NULL CHECK (avatar_id IN (
    'echo', 'silver_signal', 'red_rift',
    'rare_yuki', 'rare_nara', 'rare_kenja', 'rare_lina', 'rare_zero'
  )),
  featured_achievement_ids_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_profile_authority_username
  ON player_profile_authority(username COLLATE NOCASE);
