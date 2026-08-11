CREATE UNIQUE INDEX IF NOT EXISTS idx_social_relationship_pair
ON social_relationships (
  CASE WHEN requester_uid < addressee_uid THEN requester_uid ELSE addressee_uid END,
  CASE WHEN requester_uid < addressee_uid THEN addressee_uid ELSE requester_uid END
);

CREATE INDEX IF NOT EXISTS idx_social_relationship_requester
  ON social_relationships(requester_uid, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_relationship_addressee
  ON social_relationships(addressee_uid, status, updated_at DESC);

CREATE TABLE network_social_profiles (
  user_id TEXT PRIMARY KEY,
  signal_code TEXT NOT NULL UNIQUE CHECK (length(signal_code) BETWEEN 8 AND 16),
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  presence_visibility TEXT NOT NULL DEFAULT 'friends' CHECK (
    presence_visibility IN ('friends', 'private')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE social_mutes (
  muter_uid TEXT NOT NULL,
  muted_uid TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (muter_uid, muted_uid),
  CHECK (muter_uid <> muted_uid),
  FOREIGN KEY (muter_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (muted_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE TABLE social_action_events (
  event_id TEXT PRIMARY KEY,
  actor_uid TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'request', 'accept', 'decline', 'remove', 'block', 'unblock',
    'mute', 'unmute', 'report'
  )),
  target_uid TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_uid) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_social_action_rate
  ON social_action_events(actor_uid, created_at DESC);

CREATE TRIGGER prevent_social_action_event_update
BEFORE UPDATE ON social_action_events BEGIN
  SELECT RAISE(ABORT, 'social_action_events is append-only');
END;
CREATE TRIGGER prevent_social_action_event_delete
BEFORE DELETE ON social_action_events BEGIN
  SELECT RAISE(ABORT, 'social_action_events is append-only');
END;
