import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, usersTable, userSessionsTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

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
//   3. Client sends no UUID but does send a fingerprint → mint a fresh UID (fingerprint-only
//      lookup is no longer allowed to prevent account hijacking via fingerprint spoofing)
//   4. Otherwise → mint a fresh UUID, insert new user
//
// Fingerprints are stored for future reference but are no longer used for identity lookup
// without explicit uid authentication.
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
      const [existing] = await db
        .select({ uid: usersTable.uid })
        .from(usersTable)
        .where(eq(usersTable.uid, existingUid));

      if (existing) {
        uid = existingUid;
        if (fp) {
          await db
            .update(usersTable)
            .set({ fingerprint: fp })
            .where(eq(usersTable.uid, uid));
        }
      } else {
        uid = existingUid;
        await db.insert(usersTable).values({ uid, geoCity: city ?? null, fingerprint: fp });
      }
    } else {
      // Fingerprint-only lookup removed for security. Mint a fresh UID.
      uid = randomUUID();
      await db.insert(usersTable).values({ uid, geoCity: city ?? null, fingerprint: fp });
    }

    await db.insert(userSessionsTable).values({ uid, userAgent: ua, city: city ?? null });

    res.json({ uid });
  } catch (err) {
    req.log.error({ err }, "user init error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/user/profile?uid=xxx
router.get("/user/profile", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
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

    res.json({
      profile: profile ?? null,
      chatHistory: history,
      gameState: profile
        ? {
            fear: profile.gameStateFear ?? 0,
            curiosity: profile.gameStateCuriosity ?? 0,
            trustAI: profile.gameStateTrustAI ?? 0,
            level: profile.gameStateLevel ?? 1,
          }
        : null,
    });
  } catch (err) {
    req.log.error({ err }, "user profile GET error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/user/profile — partial upsert; only explicitly provided non-empty fields are written
router.post("/user/profile", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const { geoCity, wish, persona, discoveredRooms } = req.body as {
      geoCity?: string | null;
      wish?: string | null;
      persona?: string;
      discoveredRooms?: string[];
    };

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

// POST /api/user/gamestate — upsert fear/curiosity/trustAI for a user
router.post("/user/gamestate", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const { fear, curiosity, trustAI, level } = req.body as {
      fear?: number;
      curiosity?: number;
      trustAI?: number;
      level?: number;
    };

    const clamp = (v: number | undefined, min: number, max: number, def: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : def;

    const gameStateFear = clamp(fear, 0, 10, 0);
    const gameStateCuriosity = clamp(curiosity, 0, 10, 0);
    const gameStateTrustAI = clamp(trustAI, 0, 10, 0);
    const gameStateLevel = clamp(level, 1, 5, 1);

    await db
      .insert(usersTable)
      .values({ uid, gameStateFear, gameStateCuriosity, gameStateTrustAI, gameStateLevel })
      .onConflictDoUpdate({
        target: usersTable.uid,
        set: { gameStateFear, gameStateCuriosity, gameStateTrustAI, gameStateLevel, updatedAt: new Date() },
      });

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "user gamestate POST error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/user/chat — replaces stored chat history for this UID
router.post("/user/chat", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const { messages } = req.body as {
      messages: { role: string; content: string }[];
    };

    if (!Array.isArray(messages)) {
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
