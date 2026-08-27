-- Rating calculation reads a Glicko snapshot before result persistence. Keep
-- that optimistic read honest: a stale Queue delivery aborts its entire D1
-- batch and is retried from the newer rating revision.
ALTER TABLE chess_ratings
  ADD COLUMN rating_revision INTEGER NOT NULL DEFAULT 0;

ALTER TABLE chess_rating_events
  ADD COLUMN rating_revision_before INTEGER NOT NULL DEFAULT 0;

CREATE TRIGGER IF NOT EXISTS enforce_chess_rating_event_revision
BEFORE INSERT ON chess_rating_events
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'stale chess rating revision')
  WHERE COALESCE((
    SELECT rating_revision
    FROM chess_ratings
    WHERE user_id = NEW.user_id AND speed = NEW.speed
  ), 0) <> NEW.rating_revision_before;
END;
