-- Verified Chess Training is deliberately isolated from matches, ratings,
-- progression rewards, and currencies.  It records only the server-validated
-- prerequisite used by Ranked admission.
CREATE TABLE chess_training_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'expired')),
  step_index INTEGER NOT NULL CHECK (step_index BETWEEN 0 AND 3),
  fen TEXT NOT NULL CHECK (length(fen) BETWEEN 1 AND 160),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  CHECK (
    (status = 'completed' AND step_index = 3 AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  ),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

-- A player can resume exactly one live tutorial.  Expired sessions are kept
-- for audit and replaced only after their status is atomically changed.
CREATE UNIQUE INDEX idx_chess_training_one_active_session
ON chess_training_sessions(user_id)
WHERE status = 'active';

CREATE INDEX idx_chess_training_sessions_player
ON chess_training_sessions(user_id, updated_at DESC);

-- Each accepted transition has an immutable idempotency receipt.  The JSON is
-- a bounded public session snapshot, never a reward or a rating receipt.
CREATE TABLE chess_training_session_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'step_completed', 'completed', 'expired')),
  version INTEGER NOT NULL CHECK (version >= 0),
  step_index INTEGER NOT NULL CHECK (step_index BETWEEN 0 AND 3),
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL CHECK (length(request_fingerprint) BETWEEN 1 AND 256),
  response_json TEXT NOT NULL CHECK (length(response_json) BETWEEN 2 AND 4096),
  created_at TEXT NOT NULL,
  UNIQUE (session_id, idempotency_key),
  FOREIGN KEY (session_id) REFERENCES chess_training_sessions(session_id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_chess_training_event_lookup
ON chess_training_session_events(session_id, user_id, idempotency_key);

-- The move update is first in a D1 batch.  This trigger makes the following
-- event insertion fail (and roll the batch back) unless that exact optimistic
-- transition has already become the persisted session state.
CREATE TRIGGER validate_chess_training_event_state
BEFORE INSERT ON chess_training_session_events
WHEN NOT EXISTS (
  SELECT 1
  FROM chess_training_sessions
  WHERE session_id = NEW.session_id
    AND user_id = NEW.user_id
    AND version = NEW.version
    AND step_index = NEW.step_index
    AND (
      (NEW.event_type = 'started' AND status = 'active')
      OR (NEW.event_type = 'step_completed' AND status = 'active')
      OR (NEW.event_type = 'completed' AND status = 'completed')
      OR (NEW.event_type = 'expired' AND status = 'expired')
    )
)
BEGIN
  SELECT RAISE(ABORT, 'chess training event state mismatch');
END;

CREATE TRIGGER prevent_chess_training_event_update
BEFORE UPDATE ON chess_training_session_events
BEGIN
  SELECT RAISE(ABORT, 'chess_training_session_events is append-only');
END;

CREATE TRIGGER prevent_chess_training_event_delete
BEFORE DELETE ON chess_training_session_events
BEGIN
  SELECT RAISE(ABORT, 'chess_training_session_events is append-only');
END;

-- Sessions may move forward or expire, but a finished/expired training cannot
-- be silently reopened and completion can never be erased.
CREATE TRIGGER protect_chess_training_session_terminal_state
BEFORE UPDATE OF status, step_index, version, completed_at ON chess_training_sessions
WHEN (OLD.status IN ('completed', 'expired') AND NEW.status <> OLD.status)
  OR (OLD.status = 'completed' AND NEW.completed_at <> OLD.completed_at)
  OR (NEW.version < OLD.version)
  OR (NEW.status = 'completed' AND (NEW.step_index <> 3 OR NEW.completed_at IS NULL))
  OR (NEW.status <> 'completed' AND NEW.completed_at IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'invalid chess training session transition');
END;
