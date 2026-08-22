PRAGMA foreign_keys = ON;

-- Server-owned, UTC-day quota claims for result progression. A claim is made
-- before XP/bond/rating writes and is keyed by match id, which makes Queue's
-- at-least-once delivery idempotent without trusting a browser counter.
CREATE TABLE network_reward_quota_claims (
  scope TEXT NOT NULL CHECK (scope IN ('chess-pair', 'coop-case')),
  subject_key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  match_id TEXT NOT NULL,
  limit_value INTEGER NOT NULL CHECK (limit_value BETWEEN 1 AND 10),
  claimed_at TEXT NOT NULL,
  PRIMARY KEY (scope, subject_key, window_start, match_id)
);

CREATE INDEX idx_network_reward_quota_subject
  ON network_reward_quota_claims(scope, subject_key, window_start);

-- The check runs in D1/SQLite at insert time, rather than as a vulnerable
-- read-then-write in a Worker. Existing match claims are intentionally
-- ignored so Queue retries do not consume another slot.
CREATE TRIGGER enforce_network_reward_quota_claim_limit
BEFORE INSERT ON network_reward_quota_claims
WHEN NOT EXISTS (
  SELECT 1 FROM network_reward_quota_claims existing_claim
  WHERE existing_claim.scope = NEW.scope
    AND existing_claim.subject_key = NEW.subject_key
    AND existing_claim.window_start = NEW.window_start
    AND existing_claim.match_id = NEW.match_id
) AND (
  SELECT COUNT(*) FROM network_reward_quota_claims
  WHERE scope = NEW.scope
    AND subject_key = NEW.subject_key
    AND window_start = NEW.window_start
) >= NEW.limit_value
BEGIN
  SELECT RAISE(ABORT, 'network_reward_quota_exhausted');
END;

CREATE TRIGGER prevent_network_reward_quota_claim_update
BEFORE UPDATE ON network_reward_quota_claims BEGIN
  SELECT RAISE(ABORT, 'network_reward_quota_claims are append-only');
END;

CREATE TRIGGER prevent_network_reward_quota_claim_delete
BEFORE DELETE ON network_reward_quota_claims BEGIN
  SELECT RAISE(ABORT, 'network_reward_quota_claims are append-only');
END;
