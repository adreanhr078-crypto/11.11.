PRAGMA foreign_keys = ON;

-- Reader checkpoints are immutable evidence for a later Canon milestone.
-- They never grant XP, fragments, or a completion by themselves.
CREATE TABLE IF NOT EXISTS player_manhwa_page_records (
  user_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL CHECK (chapter_id IN (
    'chapter_0', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4'
  )),
  page_id TEXT NOT NULL,
  global_page_number INTEGER NOT NULL CHECK (
    global_page_number >= 1 AND global_page_number <= 71
  ),
  viewed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, page_id),
  FOREIGN KEY (user_id)
    REFERENCES player_progression(user_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_manhwa_page_records_chapter
  ON player_manhwa_page_records(user_id, chapter_id, global_page_number ASC);

CREATE TRIGGER IF NOT EXISTS prevent_player_manhwa_page_record_update
BEFORE UPDATE ON player_manhwa_page_records
BEGIN
  SELECT RAISE(ABORT, 'player_manhwa_page_records is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_manhwa_page_record_delete
BEFORE DELETE ON player_manhwa_page_records
BEGIN
  SELECT RAISE(ABORT, 'player_manhwa_page_records is append-only');
END;

-- Canon milestones are a server-issued, append-only ledger. The client only
-- submits a verified reader checkpoint; the Worker resolves it to a fixed
-- Canon event.
CREATE TABLE IF NOT EXISTS player_canon_event_records (
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_version INTEGER NOT NULL CHECK (event_version > 0),
  source_type TEXT NOT NULL CHECK (source_type = 'manhwa'),
  source_id TEXT NOT NULL,
  source_page_id TEXT NOT NULL,
  source_page_number INTEGER NOT NULL CHECK (source_page_number > 0),
  reached_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_id, event_version),
  FOREIGN KEY (user_id)
    REFERENCES player_progression(user_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_player_canon_event_records_player
  ON player_canon_event_records(user_id, reached_at ASC, event_id ASC);

CREATE TRIGGER IF NOT EXISTS prevent_player_canon_event_record_update
BEFORE UPDATE ON player_canon_event_records
BEGIN
  SELECT RAISE(ABORT, 'player_canon_event_records is append-only');
END;

CREATE TRIGGER IF NOT EXISTS prevent_player_canon_event_record_delete
BEFORE DELETE ON player_canon_event_records
BEGIN
  SELECT RAISE(ABORT, 'player_canon_event_records is append-only');
END;
