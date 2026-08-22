-- One server-owned active lease per player prevents an account from entering
-- Chess and Co-op at the same time. `expires_at` is a bounded crash-recovery
-- escape hatch; the normal release happens only with terminal receipt
-- persistence in the realtime Worker.
CREATE TABLE network_active_match_leases (
  user_id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN (
    'chess_ranked_blitz', 'chess_ranked_rapid', 'chess_casual',
    'chess_anomaly', 'coop_breach'
  )),
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_network_active_match_lease_expiry
  ON network_active_match_leases(expires_at);

-- `acquired_at` is supplied by the server that is attempting the claim. An
-- UPSERT may refresh the exact same room or replace an already expired lease,
-- but cannot steal an unexpired lease from a different room. Raising from the
-- trigger makes D1's enclosing batch atomic across every player in the match.
CREATE TRIGGER prevent_network_active_match_lease_takeover
BEFORE UPDATE OF room_id ON network_active_match_leases
WHEN OLD.room_id <> NEW.room_id
  AND OLD.expires_at > NEW.acquired_at
BEGIN
  SELECT RAISE(ABORT, 'network_active_match_in_progress');
END;
