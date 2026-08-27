-- `completeStoryPuzzle` calculates perfect status inside its D1 transaction.
-- This protects future writers too: an immutable hint receipt always rules out
-- a perfect completion receipt.
CREATE TRIGGER IF NOT EXISTS enforce_story_puzzle_perfect_without_hint
BEFORE INSERT ON player_story_puzzle_completion_events
FOR EACH ROW
WHEN NEW.perfect_solve = 1
BEGIN
  SELECT RAISE(ABORT, 'story puzzle perfect solve requires no hint')
  WHERE EXISTS (
    SELECT 1
    FROM player_story_puzzle_hint_events
    WHERE user_id = NEW.user_id
      AND puzzle_id = NEW.puzzle_id
  );
END;
