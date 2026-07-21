import { Router } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

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
router.post("/push/subscribe", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid ?? "anonymous";

  try {
    const body = req.body as {
      token_type?: string;
      endpoint?: string;
      subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
    };

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
router.delete("/push/subscribe", async (req: AuthenticatedRequest, res) => {
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
router.patch("/push/schedule", async (req: AuthenticatedRequest, res) => {
  try {
    const { endpoint, scheduleMask } = req.body as {
      endpoint?: string;
      scheduleMask?: number;
    };
    if (!endpoint || scheduleMask === undefined || !Number.isInteger(scheduleMask)) {
      res.status(400).json({ error: "endpoint and scheduleMask required" });
      return;
    }

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
router.get("/push/count", async (req: AuthenticatedRequest, res) => {
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
router.get("/push/schedule", async (req: AuthenticatedRequest, res) => {
  try {
    const endpoint = req.query["endpoint"] as string | undefined;
    if (!endpoint) { res.status(400).json({ error: "endpoint required" }); return; }

    const rows = await db
      .select({ scheduleMask: pushSubscriptionsTable.scheduleMask })
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint))
      .limit(1);

    if (rows.length === 0) { res.status(404).json({ error: "not found" }); return; }
    res.json({ scheduleMask: rows[0]!.scheduleMask });
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
        dead.push(tokens[i]!);
      }
    });
  } catch (err) {
    logger.error({ err }, "Expo Push API fetch failed");
  }

  return dead;
}

export type UserProfile = {
  name: string | null;
  wish: string | null;
  fear: string | null;
  geoCity: string | null;
};

export type MessagePayload = { title: string; body: string };
export type MessageFactory = (profile: UserProfile | null) => MessagePayload;

// Exported for the cron job — sends a personalized message per subscriber.
export async function sendPushToAll(
  makeMessage: MessageFactory,
  bitFlag?: number
): Promise<void> {
  const allSubs = await db.select().from(pushSubscriptionsTable);
  if (allSubs.length === 0) return;

  const subs = bitFlag !== undefined
    ? allSubs.filter((s) => (s.scheduleMask & bitFlag) !== 0)
    : allSubs;

  if (subs.length === 0) return;

  const uids = [...new Set(subs.map((s) => s.uid).filter((u) => u !== "anonymous"))];

  const profileMap = new Map<string, UserProfile>();
  if (uids.length > 0) {
    const allProfiles = await Promise.all(
      uids.map((uid) =>
        db
          .select({
            uid: usersTable.uid,
            name: usersTable.name,
            wish: usersTable.wish,
            fear: usersTable.fear,
            geoCity: usersTable.geoCity,
          })
          .from(usersTable)
          .where(eq(usersTable.uid, uid))
          .then((rows) => rows[0] ?? null)
      )
    );

    for (const p of allProfiles) {
      if (p) profileMap.set(p.uid, { name: p.name, wish: p.wish, fear: p.fear, geoCity: p.geoCity });
    }
  }

  logger.info({ total: subs.length, bitFlag }, "Sending personalized push to subscribers");

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
          const profile = profileMap.get(s.uid) ?? null;
          const payload = makeMessage(profile);
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
    const deadTokens: string[] = [];
    await Promise.all(
      expoSubs.map(async (s) => {
        const profile = profileMap.get(s.uid) ?? null;
        const payload = makeMessage(profile);
        const dead = await sendExpoPush([s.endpoint], payload);
        deadTokens.push(...dead);
      })
    );
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
