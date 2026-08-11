-- Keep hint spending valid under concurrent completion and hint requests. The
-- API performs friendly prechecks, while these triggers are the final atomic
-- authority inside the same transaction as the append-only hint event.
CREATE TRIGGER IF NOT EXISTS enforce_live_hint_sequence
BEFORE INSERT ON live_challenge_hint_events
FOR EACH ROW WHEN NEW.hint_index > 0
BEGIN
  SELECT RAISE(ABORT, 'previous live hint required')
  WHERE NOT EXISTS (
    SELECT 1
    FROM live_challenge_hint_events
    WHERE user_id = NEW.user_id
      AND challenge_id = NEW.challenge_id
      AND hint_index = NEW.hint_index - 1
  );
END;

CREATE TRIGGER IF NOT EXISTS enforce_live_hint_attempt_state
BEFORE INSERT ON live_challenge_hint_events
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'live challenge already complete')
  WHERE EXISTS (
    SELECT 1
    FROM live_challenge_definitions AS definition
    WHERE definition.challenge_id = NEW.challenge_id
      AND (
        (
          definition.challenge_kind = 'daily'
          AND NOT EXISTS (
            SELECT 1
            FROM live_player_daily_attempts AS attempt
            WHERE attempt.user_id = NEW.user_id
              AND attempt.challenge_id = NEW.challenge_id
              AND attempt.status <> 'completed'
          )
        )
        OR
        (
          definition.challenge_kind = 'weekly'
          AND NOT EXISTS (
            SELECT 1
            FROM live_player_weekly_progress AS progress
            WHERE progress.user_id = NEW.user_id
              AND progress.week_id = definition.period_key
              AND progress.status <> 'completed'
              AND NEW.challenge_id LIKE '%:stage:' || CAST(progress.current_stage AS TEXT)
          )
        )
      )
  );
END;
