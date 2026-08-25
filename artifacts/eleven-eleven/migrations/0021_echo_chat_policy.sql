-- Echo free conversation is an optional companion feature, not a limitless
-- backend resource. Keep its first production policy in D1 so Operations can
-- adjust a bounded value without putting any provider credential in clients.
CREATE TABLE IF NOT EXISTS echo_runtime_policy (
  policy_key TEXT PRIMARY KEY,
  integer_value INTEGER NOT NULL CHECK (integer_value >= 0 AND integer_value <= 300),
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO echo_runtime_policy (
  policy_key,
  integer_value,
  updated_at
) VALUES (
  'chat_daily_limit',
  30,
  CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS enforce_echo_request_daily_limit;

CREATE TRIGGER enforce_echo_request_daily_limit
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
    ELSE COALESCE((
      SELECT integer_value
      FROM echo_runtime_policy
      WHERE policy_key = 'chat_daily_limit'
    ), 30)
  END;
END;
