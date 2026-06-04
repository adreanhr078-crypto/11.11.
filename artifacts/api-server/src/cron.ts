// Scheduled push notifications are intentionally DISABLED.
//
// 11.11 used to fire recurring "entity" push notifications at 11:11, 23:11 and
// 3:33. That constant scheduled harassment was removed as part of the move to a
// puzzle-primary, atmosphere-first design. The web-push subscription routes in
// routes/push.ts remain available for any future opt-in use, but nothing is
// scheduled here anymore.
import { logger } from "./lib/logger";

logger.info("Scheduled push cron disabled — no recurring entity notifications.");
