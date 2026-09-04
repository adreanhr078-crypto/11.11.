-- Opening gateway receipts are append-only server authority. The client can
-- animate and retry, but it cannot mint the room or Manhwa entitlement.
CREATE TABLE IF NOT EXISTS player_opening_recovery_receipts (
  user_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL UNIQUE,
  puzzle_id TEXT NOT NULL,
  puzzle_version INTEGER NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_opening_room_receipts (
  user_id TEXT PRIMARY KEY,
  receipt_id TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL,
  room_version INTEGER NOT NULL,
  packet_id TEXT NOT NULL,
  page_ids_json TEXT NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS prevent_player_opening_recovery_receipt_update
BEFORE UPDATE ON player_opening_recovery_receipts
BEGIN
  SELECT RAISE(ABORT, 'opening recovery receipts are append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_opening_recovery_receipt_delete
BEFORE DELETE ON player_opening_recovery_receipts
BEGIN
  SELECT RAISE(ABORT, 'opening recovery receipts are append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_opening_room_receipt_update
BEFORE UPDATE ON player_opening_room_receipts
BEGIN
  SELECT RAISE(ABORT, 'opening room receipts are append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_opening_room_receipt_delete
BEFORE DELETE ON player_opening_room_receipts
BEGIN
  SELECT RAISE(ABORT, 'opening room receipts are append-only');
END;
