PRAGMA foreign_keys = OFF;

-- Preserve the historical XP ledger while adding explicit online and season
-- sources. The old online_chess value remains readable for existing accounts.
CREATE TABLE xp_reward_events_v15 (
  user_id TEXT NOT NULL,
  reward_key TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'puzzle', 'manhwa', 'story', 'secret', 'achievement',
    'daily_trial', 'weekly_trial', 'online_chess',
    'chess_match', 'coop_breach', 'season_case'
  )),
  source_id TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  granted_at TEXT NOT NULL,
  PRIMARY KEY (user_id, reward_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

INSERT INTO xp_reward_events_v15
SELECT user_id, reward_key, source_type, source_id, xp_amount, granted_at
FROM xp_reward_events;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_update;
DROP TRIGGER IF EXISTS prevent_xp_reward_event_delete;
DROP TABLE xp_reward_events;
ALTER TABLE xp_reward_events_v15 RENAME TO xp_reward_events;
CREATE INDEX idx_xp_reward_events_player
  ON xp_reward_events(user_id, granted_at DESC);
CREATE TRIGGER prevent_xp_reward_event_update
BEFORE UPDATE ON xp_reward_events BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;
CREATE TRIGGER prevent_xp_reward_event_delete
BEFORE DELETE ON xp_reward_events BEGIN
  SELECT RAISE(ABORT, 'xp_reward_events is append-only');
END;

PRAGMA foreign_keys = ON;

CREATE TABLE network_match_receipts (
  receipt_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL CHECK (mode IN (
    'chess_ranked_blitz', 'chess_ranked_rapid', 'chess_casual',
    'chess_anomaly', 'coop_breach'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'completed', 'resigned', 'timeout', 'abandoned'
  )),
  winner_uid TEXT,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  completed_at TEXT NOT NULL,
  integrity_hash TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE network_match_participants (
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'draw', 'completed')),
  participation_ms INTEGER NOT NULL CHECK (participation_ms >= 0),
  reward_key TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount >= 0),
  PRIMARY KEY (match_id, user_id),
  UNIQUE (user_id, reward_key),
  FOREIGN KEY (match_id) REFERENCES network_match_receipts(match_id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_network_participants_player
  ON network_match_participants(user_id, match_id DESC);

CREATE TRIGGER prevent_network_receipt_update
BEFORE UPDATE ON network_match_receipts BEGIN
  SELECT RAISE(ABORT, 'network_match_receipts is append-only');
END;
CREATE TRIGGER prevent_network_receipt_delete
BEFORE DELETE ON network_match_receipts BEGIN
  SELECT RAISE(ABORT, 'network_match_receipts is append-only');
END;
CREATE TRIGGER prevent_network_participant_update
BEFORE UPDATE ON network_match_participants BEGIN
  SELECT RAISE(ABORT, 'network_match_participants is append-only');
END;
CREATE TRIGGER prevent_network_participant_delete
BEFORE DELETE ON network_match_participants BEGIN
  SELECT RAISE(ABORT, 'network_match_participants is append-only');
END;

CREATE TABLE network_cosmetic_unlock_events (
  user_id TEXT NOT NULL,
  cosmetic_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('match', 'season', 'mastery')),
  source_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, cosmetic_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TRIGGER prevent_network_cosmetic_update
BEFORE UPDATE ON network_cosmetic_unlock_events BEGIN
  SELECT RAISE(ABORT, 'network_cosmetic_unlock_events is append-only');
END;
CREATE TRIGGER prevent_network_cosmetic_delete
BEFORE DELETE ON network_cosmetic_unlock_events BEGIN
  SELECT RAISE(ABORT, 'network_cosmetic_unlock_events is append-only');
END;

CREATE TABLE player_character_bond_events (
  user_id TEXT NOT NULL,
  event_key TEXT NOT NULL,
  character_id TEXT NOT NULL CHECK (character_id IN (
    'yuki', 'nara', 'kenja', 'lina', 'zero', 'echo'
  )),
  source_type TEXT NOT NULL CHECK (source_type IN ('match', 'season', 'story')),
  source_id TEXT NOT NULL,
  bond_points INTEGER NOT NULL CHECK (bond_points BETWEEN 1 AND 100),
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_key),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_character_bond_player
  ON player_character_bond_events(user_id, character_id, recorded_at ASC);

CREATE TRIGGER prevent_character_bond_update
BEFORE UPDATE ON player_character_bond_events BEGIN
  SELECT RAISE(ABORT, 'player_character_bond_events is append-only');
END;
CREATE TRIGGER prevent_character_bond_delete
BEFORE DELETE ON player_character_bond_events BEGIN
  SELECT RAISE(ABORT, 'player_character_bond_events is append-only');
END;

CREATE TABLE chess_ratings (
  user_id TEXT NOT NULL,
  speed TEXT NOT NULL CHECK (speed IN ('blitz', 'rapid')),
  rating REAL NOT NULL DEFAULT 1500,
  deviation REAL NOT NULL DEFAULT 350,
  volatility REAL NOT NULL DEFAULT 0.06,
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, speed),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE chess_rating_events (
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  speed TEXT NOT NULL CHECK (speed IN ('blitz', 'rapid')),
  rating_before REAL NOT NULL,
  deviation_before REAL NOT NULL,
  volatility_before REAL NOT NULL,
  rating_after REAL NOT NULL,
  deviation_after REAL NOT NULL,
  volatility_after REAL NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (match_id, user_id),
  FOREIGN KEY (match_id) REFERENCES network_match_receipts(match_id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TRIGGER prevent_chess_rating_event_update
BEFORE UPDATE ON chess_rating_events BEGIN
  SELECT RAISE(ABORT, 'chess_rating_events is append-only');
END;
CREATE TRIGGER prevent_chess_rating_event_delete
BEFORE DELETE ON chess_rating_events BEGIN
  SELECT RAISE(ABORT, 'chess_rating_events is append-only');
END;

CREATE TABLE network_player_milestones (
  user_id TEXT PRIMARY KEY,
  chess_training_completed_at TEXT,
  casual_chess_completed INTEGER NOT NULL DEFAULT 0 CHECK (casual_chess_completed >= 0),
  coop_training_completed_at TEXT,
  community_rules_version INTEGER NOT NULL DEFAULT 0 CHECK (community_rules_version >= 0),
  age_gate_confirmed_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE season_player_progress (
  user_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'in_progress', 'completed')),
  mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score >= 0),
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, season_id, activity_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE social_relationships (
  requester_uid TEXT NOT NULL,
  addressee_uid TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (requester_uid, addressee_uid),
  CHECK (requester_uid <> addressee_uid),
  FOREIGN KEY (requester_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (addressee_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE social_blocks (
  blocker_uid TEXT NOT NULL,
  blocked_uid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_uid, blocked_uid),
  CHECK (blocker_uid <> blocked_uid),
  FOREIGN KEY (blocker_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (blocked_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE community_posts (
  post_id TEXT PRIMARY KEY,
  author_uid TEXT,
  author_name TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('ar', 'en')),
  channel TEXT NOT NULL CHECK (channel IN (
    'official', 'story', 'puzzles', 'chess', 'coop', 'creator'
  )),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 600),
  card_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('official', 'pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  FOREIGN KEY (author_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_community_posts_channel
  ON community_posts(locale, channel, status, created_at DESC);

CREATE TABLE moderation_cases (
  case_id TEXT PRIMARY KEY,
  reporter_uid TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN (
    'message', 'post', 'profile', 'puzzle', 'match'
  )),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'abuse', 'spam', 'privacy', 'cheating', 'unsafe-content', 'other'
  )),
  detail TEXT NOT NULL CHECK (length(detail) <= 500),
  status TEXT NOT NULL CHECK (status IN (
    'open', 'automated-hold', 'reviewed', 'appealed', 'closed'
  )),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reporter_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE puzzle_forge_submissions (
  submission_id TEXT PRIMARY KEY,
  author_uid TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  solution_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (author_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_forge_approved_fingerprint
  ON puzzle_forge_submissions(solution_fingerprint)
  WHERE status = 'approved';

CREATE TABLE network_ticket_events (
  ticket_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('queue', 'connect')),
  mode TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_network_ticket_rate
  ON network_ticket_events(user_id, issued_at DESC);

INSERT OR IGNORE INTO community_posts (
  post_id, author_uid, author_name, locale, channel, body,
  card_id, status, created_at, reviewed_at
) VALUES
  ('official-ar-season-01', NULL, 'Echo Network', 'ar', 'official',
   'افتُتح موسم شقوق Echo. أكمل نوعين مختلفين من اللعب، وخذ وقتك: كل قضية ستبقى في الأرشيف.',
   'season-01', 'official', '2026-08-10T11:11:00.000Z', '2026-08-10T11:11:00.000Z'),
  ('official-en-season-01', NULL, 'Echo Network', 'en', 'official',
   'Echo Fractures is open. Complete two different play types at your pace; every case remains in the archive.',
   'season-01', 'official', '2026-08-10T11:11:00.000Z', '2026-08-10T11:11:00.000Z'),
  ('official-ar-safety-01', NULL, 'Echo', 'ar', 'official',
   'القنوات العامة تستخدم عبارات جاهزة فقط. لا حاجة لمشاركة اسمك الحقيقي أو أي بيانات شخصية لتجد فريقًا.',
   'safety-01', 'official', '2026-08-10T11:12:00.000Z', '2026-08-10T11:12:00.000Z'),
  ('official-en-safety-01', NULL, 'Echo', 'en', 'official',
   'Public channels use preset phrases only. You never need to share a real name or personal data to find a team.',
   'safety-01', 'official', '2026-08-10T11:12:00.000Z', '2026-08-10T11:12:00.000Z');
