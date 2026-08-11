-- Smart live puzzles are generated from the period key, but their fingerprints
-- are still registered so a future generator change cannot silently reuse an
-- already published puzzle instance.
CREATE TABLE IF NOT EXISTS smart_live_generation_registry (
  fingerprint TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE,
  challenge_kind TEXT NOT NULL CHECK (challenge_kind IN ('daily', 'weekly')),
  period_key TEXT NOT NULL,
  registered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_live_generation_registry_period
  ON smart_live_generation_registry(challenge_kind, period_key);

CREATE TRIGGER IF NOT EXISTS prevent_smart_live_registry_update
BEFORE UPDATE ON smart_live_generation_registry
BEGIN
  SELECT RAISE(ABORT, 'smart_live_generation_registry is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_smart_live_registry_delete
BEFORE DELETE ON smart_live_generation_registry
BEGIN
  SELECT RAISE(ABORT, 'smart_live_generation_registry is append-only');
END;
