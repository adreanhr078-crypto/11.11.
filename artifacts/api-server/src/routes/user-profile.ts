import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, usersTable, userSessionsTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

// UUIDv4 format guard — only accept well-formed UUIDs from clients
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST /api/user/init — server-issues a high-entropy anonymous UID
// If the client already has a valid UUID UID, validates it and records a new session.
// If not, creates a fresh UUID and user record.
router.post("/user/init", async (req, res) => {
  try {
    const { uid: existingUid, city, userAgent: clientUserAgent } = req.body as {
      uid?: string;
      city?: string | null;
      userAgent?: string;
    };

    const ua = clientUserAgent ?? req.headers["user-agent"] ?? null;

    let uid: string;

    // Only accept well-formed UUIDs — reject arbitrary/guessable values
    if (existingUid && typeof existingUid === "string" && UUID_RE.test(existingUid)) {
      // Check whether this UID is already in the DB
      const [existing] = await db
        .select({ uid: usersTable.uid })
        .from(usersTable)
        .where(eq(usersTable.uid, existingUid));

      if (existing) {
        uid = existingUid;
      } else {
        // UID came from client but doesn't exist in DB (e.g., cleared DB / migration)
        // Trust it — insert as new user to preserve UID continuity
        uid = existingUid;
        await db.insert(usersTable).values({
          uid,
          geoCity: city ?? null,
        });
      }
    } else {
      // First visit — issue a fresh server-generated UID
      uid = randomUUID();
      await db.insert(usersTable).values({
        uid,
        geoCity: city ?? null,
      });
    }

    // Record this session
    await db.insert(userSessionsTable).values({
      uid,
      userAgent: ua,
      city: city ?? null,
    });

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
    if (!uid || typeof uid !== "string" || uid.length > 128) {
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

// POST /api/user/profile — upsert profile fields
router.post("/user/profile", async (req, res) => {
  try {
    const { uid, geoCity, wish, persona, discoveredRooms } = req.body as {
      uid: string;
      geoCity?: string | null;
      wish?: string | null;
      persona?: string;
      discoveredRooms?: string[];
    };

    if (!uid || typeof uid !== "string" || uid.length > 128) {
      res.status(400).json({ error: "invalid uid" });
      return;
    }

    const updateFields: Partial<typeof usersTable.$inferInsert> = {};
    if (geoCity !== undefined) updateFields.geoCity = geoCity ?? null;
    if (wish !== undefined) updateFields.wish = wish ?? null;
    if (persona !== undefined) updateFields.persona = persona;
    if (discoveredRooms !== undefined) updateFields.discoveredRooms = discoveredRooms;

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

    if (!uid || typeof uid !== "string" || uid.length > 128 || !Array.isArray(messages)) {
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
