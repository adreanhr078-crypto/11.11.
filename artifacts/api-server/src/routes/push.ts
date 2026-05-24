import { Router } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const VAPID_PUBLIC_KEY = process.env["VAPID_PUBLIC_KEY"] ?? "";
const VAPID_PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"] ?? "";
const VAPID_CONTACT = "mailto:entity@eleven-eleven.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn("VAPID keys not configured — web push notifications disabled");
}

// POST /api/push/subscribe — save a Web Push or Expo push subscription
// Web format:  { uid, subscription: { endpoint, keys: { p256dh, auth } } }
// Expo format: { uid, token_type: "expo", endpoint: "ExponentPushToken[xxx]" }
router.post("/push/subscribe", async (req, res) => {
  try {
    const body = req.body as {
      uid?: string;
      token_type?: string;
      endpoint?: string;
      subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
    };

    const uid = body.uid ?? "anonymous";

    // Expo push token (direct endpoint + token_type)
    if (body.token_type === "expo" && body.endpoint) {
      await db
        .insert(pushSubscriptionsTable)
        .values({ uid, endpoint: body.endpoint, tokenType: "expo" })
        .onConflictDoUpdate({
          target: pushSubscriptionsTable.endpoint,
          set: { uid, tokenType: "expo" },
        });
      res.json({ ok: true });
      return;
    }

    // Web Push subscription (existing web app format)
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      res.status(400).json({ error: "invalid subscription" });
      return;
    }

    await db
      .insert(pushSubscriptionsTable)
      .values({
        uid,
        endpoint: sub.endpoint,
        tokenType: "web",
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, uid, tokenType: "web" },
      });

    res.json({ ok: true, endpoint: sub.endpoint });
  } catch (err) {
    req.log.error({ err }, "push subscribe error");
    res.status(500).json({ error: "internal" });
  }
});

// DELETE /api/push/subscribe — opt-out, remove this subscription entirely
router.delete("/push/subscribe", async (req, res) => {
  try {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) { res.status(400).json({ error: "endpoint required" }); return; }

    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "push unsubscribe error");
    res.status(500).json({ error: "internal" });
  }
});

// PATCH /api/push/schedule — update which time slots this subscription receives
// scheduleMask: bitmask integer — bit0=11:11, bit1=23:11, bit2=3:33 (always forced on server)
router.patch("/push/schedule", async (req, res) => {
  try {
    const { endpoint, scheduleMask } = req.body as {
      endpoint?: string;
      scheduleMask?: number;
    };
    if (!endpoint || scheduleMask === undefined || !Number.isInteger(scheduleMask)) {
      res.status(400).json({ error: "endpoint and scheduleMask required" });
      return;
    }

    // Force bit2 (3:33) always on — the entity cannot be silenced
    const mask = (scheduleMask & 0b111) | 0b100;

    await db
      .update(pushSubscriptionsTable)
      .set({ scheduleMask: mask })
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));

    res.json({ ok: true, scheduleMask: mask });
  } catch (err) {
    req.log.error({ err }, "push schedule update error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/push/count — active subscriber count by type
router.get("/push/count", async (req, res) => {
  try {
    const subs = await db
      .select({ id: pushSubscriptionsTable.id, tokenType: pushSubscriptionsTable.tokenType })
      .from(pushSubscriptionsTable);
    const web = subs.filter((s) => s.tokenType === "web").length;
    const expo = subs.filter((s) => s.tokenType === "expo").length;
    res.json({ total: subs.length, web, expo });
  } catch (err) {
    req.log.error({ err }, "push count error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/push/schedule — fetch schedule mask for a given endpoint
router.get("/push/schedule", async (req, res) => {
  try {
    const endpoint = req.query["endpoint"] as string | undefined;
    if (!endpoint) { res.status(400).json({ error: "endpoint required" }); return; }

    const rows = await db
      .select({ scheduleMask: pushSubscriptionsTable.scheduleMask })
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint))
      .limit(1);

    if (rows.length === 0) { res.status(404).json({ error: "not found" }); return; }
    res.json({ scheduleMask: rows[0].scheduleMask });
  } catch (err) {
    req.log.error({ err }, "push schedule fetch error");
    res.status(500).json({ error: "internal" });
  }
});

// Send via Expo Push API (no extra packages needed — plain fetch)
async function sendExpoPush(
  tokens: string[],
  payload: { title: string; body: string }
): Promise<string[]> {
  if (tokens.length === 0) return [];

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    sound: "default",
    priority: "high",
  }));

  const dead: string[] = [];

  try {
    const resp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });

    if (!resp.ok) {
      logger.error({ status: resp.status }, "Expo Push API error");
      return dead;
    }

    const result = (await resp.json()) as {
      data: Array<{ status: string; details?: { error?: string } }>;
    };

    result.data.forEach((r, i) => {
      if (r.status === "error" && r.details?.error === "DeviceNotRegistered") {
        dead.push(tokens[i]);
      }
    });
  } catch (err) {
    logger.error({ err }, "Expo Push API fetch failed");
  }

  return dead;
}

// Exported for the cron job.
// bitFlag: which schedule bit to check (1=11:11, 2=23:11, undefined=3:33 sends to ALL)
export async function sendPushToAll(
  payload: { title: string; body: string },
  bitFlag?: number
): Promise<void> {
  // If bitFlag is set, only fetch subscriptions that have that bit enabled
  const allSubs = await db.select().from(pushSubscriptionsTable);
  if (allSubs.length === 0) return;

  const subs = bitFlag !== undefined
    ? allSubs.filter((s) => (s.scheduleMask & bitFlag) !== 0)
    : allSubs; // 3:33 goes to everyone — the entity cannot be silenced

  if (subs.length === 0) return;

  logger.info({ total: subs.length, bitFlag }, "Sending push to subscribers");

  const webSubs = subs.filter((s) => s.tokenType === "web");
  const expoSubs = subs.filter((s) => s.tokenType === "expo");
  const deadIds: number[] = [];

  // ── Web Push ─────────────────────────────────────────────────────────────────
  if (webSubs.length > 0) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      logger.warn("Web Push skipped — VAPID keys not configured");
    } else {
      await Promise.allSettled(
        webSubs.map(async (s) => {
          if (!s.p256dh || !s.auth) return;
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify(payload),
              { TTL: 3600 }
            );
          } catch (err: unknown) {
            const code = (err as { statusCode?: number }).statusCode;
            if (code === 410 || code === 404) deadIds.push(s.id);
            else logger.error({ err, endpoint: s.endpoint.slice(0, 40) }, "web push failed");
          }
        })
      );
    }
  }

  // ── Expo Push ─────────────────────────────────────────────────────────────────
  if (expoSubs.length > 0) {
    const tokens = expoSubs.map((s) => s.endpoint);
    const deadTokens = await sendExpoPush(tokens, payload);
    for (const token of deadTokens) {
      const sub = expoSubs.find((s) => s.endpoint === token);
      if (sub) deadIds.push(sub.id);
    }
  }

  // Prune dead subscriptions
  if (deadIds.length > 0) {
    await Promise.all(
      deadIds.map((id) => db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, id)))
    );
    logger.info({ pruned: deadIds.length }, "Pruned expired push subscriptions");
  }
}

export default router;
