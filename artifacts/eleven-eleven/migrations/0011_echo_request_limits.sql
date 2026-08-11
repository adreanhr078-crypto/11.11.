-- Provider-backed Echo features are authenticated and metered per player.
-- Trigger checks execute in the same D1 transaction as each insert, keeping
-- parallel requests from racing past the configured cost controls.
CREATE TABLE IF NOT EXISTS echo_request_events (
  request_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL CHECK (capability IN ('chat', 'transcribe')),
  requested_at_ms INTEGER NOT NULL CHECK (requested_at_ms > 0),
  requested_at TEXT NOT NULL,
  FOREIGN KEY (user_id)
    REFERENCES player_progression(user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_echo_request_events_player_window
  ON echo_request_events(user_id, capability, requested_at_ms DESC);

CREATE TRIGGER IF NOT EXISTS enforce_echo_request_minute_limit
BEFORE INSERT ON echo_request_events
BEGIN
  SELECT RAISE(ABORT, 'echo minute rate limit exceeded')
  WHERE (
    SELECT COUNT(*)
    FROM echo_request_events
    WHERE user_id = NEW.user_id
      AND capability = NEW.capability
      AND requested_at_ms > NEW.requested_at_ms - 60000
  ) >= CASE NEW.capability
    WHEN 'transcribe' THEN 4
    ELSE 12
  END;
END;

CREATE TRIGGER IF NOT EXISTS enforce_echo_request_daily_limit
BEFORE INSERT ON echo_request_events
BEGIN
  SELECT RAISE(ABORT, 'echo daily rate limit exceeded')
  WHERE (
    SELECT COUNT(*)
    FROM echo_request_events
    WHERE user_id = NEW.user_id
      AND capability = NEW.capability
      AND requested_at_ms > NEW.requested_at_ms - 86400000
  ) >= CASE NEW.capability
    WHEN 'transcribe' THEN 30
    ELSE 120
  END;
END;
