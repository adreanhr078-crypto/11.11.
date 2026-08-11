CREATE TABLE network_room_memberships (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN (
    'chess_ranked_blitz', 'chess_ranked_rapid', 'chess_casual',
    'chess_anomaly', 'coop_breach'
  )),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (user_id) REFERENCES player_progression(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_network_room_membership_player
  ON network_room_memberships(user_id, expires_at DESC);
