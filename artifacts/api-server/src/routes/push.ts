import { Router } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const VAPID_PUBLIC_KEY = process.env["VAPID_PUBLIC_KEY"] ?? "";
const VAPID_PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"] ?? "";
const VAPID_CONTACT = "mailto:entity@eleven-eleven.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn("VAPID keys not configured — push notifications disabled");
}

// POST /api/push/subscribe — save a Web Push subscription for this user
router.post("/push/subscribe", async (req, res) => {
  try {
    const { uid, subscription } = req.body as {
      uid?: string;
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    };

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: "invalid subscription" });
      return;
    }

    await db
      .insert(pushSubscriptionsTable)
      .values({
        uid: uid ?? "anonymous",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          uid: uid ?? "anonymous",
        },
      });

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "push subscribe error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/push/count — how many active subscribers (internal/debug)
router.get("/push/count", async (req, res) => {
  try {
    const subs = await db.select({ id: pushSubscriptionsTable.id }).from(pushSubscriptionsTable);
    res.json({ count: subs.length });
  } catch (err) {
    req.log.error({ err }, "push count error");
    res.status(500).json({ error: "internal" });
  }
});

// Exported for use by the cron job
export async function sendPushToAll(payload: { title: string; body: string }): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn("Push skipped — VAPID keys not configured");
    return;
  }

  const subs = await db.select().from(pushSubscriptionsTable);
  if (subs.length === 0) return;

  logger.info({ count: subs.length }, "Sending push to all subscribers");

  const dead: number[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 3600 }
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 410 || code === 404) {
          // Endpoint expired — mark for cleanup
          dead.push(s.id);
        } else {
          logger.error({ err, endpoint: s.endpoint.slice(0, 40) }, "push send failed");
        }
      }
    })
  );

  // Prune dead subscriptions
  if (dead.length > 0) {
    await Promise.all(
      dead.map((id) => db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, id)))
    );
    logger.info({ pruned: dead.length }, "Pruned expired push subscriptions");
  }
}

export default router;
