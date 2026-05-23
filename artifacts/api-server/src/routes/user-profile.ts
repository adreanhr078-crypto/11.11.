import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, usersTable, userSessionsTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

// UUIDv4 format guard — enforce on every endpoint that accepts a uid
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

// POST /api/user/init — server-issues a high-entropy anonymous UID.
//
// Cross-device identity resolution order:
//   1. Client sends a well-formed UUIDv4 that exists in DB → reuse it (same device/browser)
//   2. Client sends a well-formed UUIDv4 not yet in DB (e.g. cleared DB) → trust & reinsert
//   3. Client sends no UUID but does send a fingerprint that matches a DB row → reuse that UID
//   4. Otherwise → mint a fresh UUID, insert new user, store fingerprint
//
// This means a user arriving on a new device with the same browser+hardware fingerprint
// will have their existing wish/rooms/chat restored without any login.
router.post("/user/init", async (req, res) => {
  try {
    const {
      uid: existingUid,
      fingerprint,
      city,
      userAgent: clientUserAgent,
    } = req.body as {
      uid?: string;
      fingerprint?: string | null;
      city?: string | null;
      userAgent?: string;
    };

    const ua = clientUserAgent ?? req.headers["user-agent"] ?? null;
    const fp = fingerprint && typeof fingerprint === "string" && fingerprint.length > 0
      ? fingerprint.slice(0, 512) // cap length
      : null;

    let uid: string;

    if (isValidUuid(existingUid)) {
      // Client claims an identity — verify it exists
      const [existing] = await db
        .select({ uid: usersTable.uid })
        .from(usersTable)
        .where(eq(usersTable.uid, existingUid));

      if (existing) {
        uid = existingUid;
        // Keep fingerprint current (device may have updated or first time we see it)
        if (fp) {
          await db
            .update(usersTable)
            .set({ fingerprint: fp })
            .where(eq(usersTable.uid, uid));
        }
      } else {
        // Valid UUID but not in DB (cleared DB / migration) — restore with new insert
        uid = existingUid;
        await db.insert(usersTable).values({ uid, geoCity: city ?? null, fingerprint: fp });
      }
    } else if (fp) {
      // No UUID — try fingerprint cross-device lookup
      const [byFp] = await db
        .select({ uid: usersTable.uid })
        .from(usersTable)
        .where(eq(usersTable.fingerprint, fp))
        .limit(1);

      if (byFp) {
        // Fingerprint matched an existing user → restore that identity cross-device
        uid = byFp.uid;
      } else {
        // Completely new visitor — mint a fresh UUID
        uid = randomUUID();
        await db.insert(usersTable).values({ uid, geoCity: city ?? null, fingerprint: fp });
      }
    } else {
      // No UUID, no fingerprint — mint a fresh UUID
      uid = randomUUID();
      await db.insert(usersTable).values({ uid, geoCity: city ?? null });
    }

    // Record this session
    await db.insert(userSessionsTable).values({ uid, userAgent: ua, city: city ?? null });

    res.json({ uid });
  } catch (err) {
    req.log.error({ err }, "user init error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/user/profile?uid=xxx
router.get("/user/profile", async (req, res) => {
  try {
    const uid = req.query["uid"];
    if (!isValidUuid(uid)) {
      res.status(400).json({ error: "invalid uid" });
      return;
    }

    const [profile] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    const history = await db
      .select()
      .from(chatHistoryTable)
      .where(eq(chatHistoryTable.uid, uid))
      .orderBy(asc(chatHistoryTable.createdAt))
      .limit(30);

    res.json({ profile: profile ?? null, chatHistory: history });
  } catch (err) {
    req.log.error({ err }, "user profile GET error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/user/profile — partial upsert; only explicitly provided non-empty fields are written
router.post("/user/profile", async (req, res) => {
  try {
    const { uid, geoCity, wish, persona, discoveredRooms } = req.body as {
      uid: string;
      geoCity?: string | null;
      wish?: string | null;
      persona?: string;
      discoveredRooms?: string[];
    };

    if (!isValidUuid(uid)) {
      res.status(400).json({ error: "invalid uid" });
      return;
    }

    // Only include fields that were explicitly sent and are non-empty, so we never
    // overwrite DB with blank defaults before hydration completes on the client.
    const updateFields: Partial<typeof usersTable.$inferInsert> = {};
    if (geoCity !== undefined && geoCity !== null) updateFields.geoCity = geoCity;
    if (wish !== undefined) updateFields.wish = wish ?? null;
    if (persona !== undefined) updateFields.persona = persona;
    if (discoveredRooms !== undefined && discoveredRooms.length > 0)
      updateFields.discoveredRooms = discoveredRooms;

    await db
      .insert(usersTable)
      .values({
        uid,
        geoCity: geoCity ?? null,
        wish: wish ?? null,
        persona: persona ?? "entity",
        discoveredRooms: discoveredRooms ?? [],
      })
      .onConflictDoUpdate({
        target: usersTable.uid,
        set: { ...updateFields, updatedAt: new Date() },
      });

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "user profile POST error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/user/chat — replaces stored chat history for this UID
router.post("/user/chat", async (req, res) => {
  try {
    const { uid, messages } = req.body as {
      uid: string;
      messages: { role: string; content: string }[];
    };

    if (!isValidUuid(uid) || !Array.isArray(messages)) {
      res.status(400).json({ error: "invalid" });
      return;
    }

    const safe = messages.slice(-30).filter(
      (m) => typeof m.role === "string" && typeof m.content === "string"
    );

    await db.delete(chatHistoryTable).where(eq(chatHistoryTable.uid, uid));

    if (safe.length > 0) {
      await db.insert(chatHistoryTable).values(
        safe.map((m) => ({ uid, role: m.role, content: m.content }))
      );
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "user chat POST error");
    res.status(500).json({ error: "internal" });
  }
});

export default router;
