-- The friendly API precheck is intentionally not the final authority. A
-- completion and a hint may arrive from two tabs at almost the same moment;
-- after the immutable completion receipt exists, no hint event may debit coins.
CREATE TRIGGER IF NOT EXISTS enforce_story_puzzle_hint_not_completed
BEFORE INSERT ON player_story_puzzle_hint_events
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'story puzzle already complete')
  WHERE EXISTS (
    SELECT 1
    FROM player_story_puzzle_completion_events
    WHERE user_id = NEW.user_id
      AND puzzle_id = NEW.puzzle_id
  );
END;
