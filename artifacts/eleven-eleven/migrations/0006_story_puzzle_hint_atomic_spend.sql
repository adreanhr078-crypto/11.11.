-- A hint receipt and its coin debit must be one database transaction. This
-- protects concurrent requests from spending the same verified balance twice.
CREATE TRIGGER IF NOT EXISTS enforce_story_puzzle_hint_balance
BEFORE INSERT ON player_story_puzzle_hint_events
FOR EACH ROW
WHEN NEW.coin_cost > 0
BEGIN
  SELECT RAISE(ABORT, 'insufficient verified coins')
  WHERE (
    SELECT COALESCE(SUM(amount), 0)
    FROM player_coin_events
    WHERE user_id = NEW.user_id
  ) < NEW.coin_cost;
END;

CREATE TRIGGER IF NOT EXISTS record_story_puzzle_hint_spend
AFTER INSERT ON player_story_puzzle_hint_events
FOR EACH ROW
WHEN NEW.coin_cost > 0
BEGIN
  INSERT INTO player_coin_events (
    user_id,
    event_key,
    source_type,
    source_id,
    amount,
    recorded_at
  ) VALUES (
    NEW.user_id,
    NEW.puzzle_id || ':hint:' || NEW.hint_index || ':v1',
    'story_puzzle_hint',
    NEW.puzzle_id,
    -NEW.coin_cost,
    NEW.unlocked_at
  );
END;
