-- A hint and a terminal Live completion may arrive from different tabs at the
-- same moment. The API retries safely, but D1 is the final source of truth:
-- no receipt may claim a perfect solve after a hint receipt exists.
CREATE TRIGGER IF NOT EXISTS enforce_daily_perfect_without_hint
BEFORE UPDATE OF status, perfect_solve ON live_player_daily_attempts
FOR EACH ROW
WHEN NEW.status = 'completed' AND NEW.perfect_solve = 1
BEGIN
  SELECT RAISE(ABORT, 'live perfect solve requires no hint')
  WHERE EXISTS (
    SELECT 1
    FROM live_challenge_hint_events
    WHERE user_id = NEW.user_id
      AND challenge_id = NEW.challenge_id
  );
END;

CREATE TRIGGER IF NOT EXISTS enforce_live_reward_perfect_without_hint
BEFORE INSERT ON live_challenge_reward_events
FOR EACH ROW
WHEN NEW.perfect_solve = 1 AND NEW.reward_type IN ('daily', 'weekly')
BEGIN
  SELECT RAISE(ABORT, 'live perfect solve requires no hint')
  WHERE (
    NEW.reward_type = 'daily'
    AND EXISTS (
      SELECT 1
      FROM live_challenge_hint_events
      WHERE user_id = NEW.user_id AND challenge_id = NEW.source_id
    )
  ) OR (
    NEW.reward_type = 'weekly'
    AND EXISTS (
      SELECT 1
      FROM live_challenge_hint_events
      WHERE user_id = NEW.user_id AND challenge_id LIKE NEW.source_id || ':stage:%'
    )
  );
END;
