-- Keep hint spending in the existing append-only coin ledger while retaining
-- an auditable source type for Daily versus Weekly hints.
DROP TRIGGER IF EXISTS record_live_hint_spend;
CREATE TRIGGER record_live_hint_spend
AFTER INSERT ON live_challenge_hint_events
FOR EACH ROW WHEN NEW.coin_cost > 0
BEGIN
  INSERT INTO player_coin_events (
    user_id, event_key, source_type, source_id, amount, recorded_at
  ) VALUES (
    NEW.user_id,
    NEW.challenge_id || ':hint:' || NEW.hint_index || ':v1',
    CASE WHEN (
      SELECT challenge_kind FROM live_challenge_definitions
      WHERE challenge_id = NEW.challenge_id
    ) = 'weekly' THEN 'weekly_trial' ELSE 'daily_trial' END,
    NEW.challenge_id, -NEW.coin_cost, NEW.used_at
  );
END;
