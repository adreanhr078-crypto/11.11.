// ARG Progression System — 5-level alternate reality game progress API
// Levels: 1=Awakening, 2=Time Gate, 3=Memory Echo, 4=System Error, 5=Truth
import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, usersTable, userSessionsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

// In-memory challenge token store for Level 4 (process-scoped, intentional)
// token → { uid, expiry } — bound to UID to prevent replay across users
const l4Tokens = new Map<string, { uid: string; expiry: number }>();
const L4_TTL_MS = 4000;

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [tok, entry] of l4Tokens) {
    if (entry.expiry < now) l4Tokens.delete(tok);
  }
}, 10_000);

function isValidUuid(s: unknown): s is string {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof s === "string" && UUID_RE.test(s);
}

// GET /api/progress?uid=xxx
router.get("/progress", async (req, res) => {
  const uid = req.query["uid"];
  if (!isValidUuid(uid)) { res.status(400).json({ error: "invalid uid" }); return; }

  try {
    const [row] = await db
      .select({ currentLevel: usersTable.currentLevel, levelUnlockedAt: usersTable.levelUnlockedAt })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row) { res.status(404).json({ error: "user not found" }); return; }

    const level = row.currentLevel ?? 1;
    const isCompleted = level > 5;
    res.json({ currentLevel: Math.min(level, 5), isCompleted, levelUnlockedAt: row.levelUnlockedAt ?? "{}" });
  } catch (err) {
    req.log.error({ err }, "progress GET error");
    res.status(500).json({ error: "internal" });
  }
});

// GET /api/progress/challenge?uid=xxx — issue a Level 4 timed challenge token
router.get("/progress/challenge", async (req, res) => {
  const uid = req.query["uid"];
  if (!isValidUuid(uid)) { res.status(400).json({ error: "invalid uid" }); return; }

  try {
    // Verify user is actually at level 4
    const [row] = await db
      .select({ currentLevel: usersTable.currentLevel })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row || row.currentLevel !== 4) {
      res.status(403).json({ error: "not at level 4" });
      return;
    }

    const token = randomUUID();
    l4Tokens.set(token, { uid, expiry: Date.now() + L4_TTL_MS });
    res.json({ token, ttlMs: L4_TTL_MS });
  } catch (err) {
    req.log.error({ err }, "progress challenge error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/progress/advance — validate level condition and bump level
router.post("/progress/advance", async (req, res) => {
  const { uid, level, answer, token } = req.body as {
    uid: string;
    level: number;
    answer?: string;
    token?: string;
  };

  if (!isValidUuid(uid) || !Number.isInteger(level) || level < 1 || level > 5) {
    res.status(400).json({ error: "invalid params" });
    return;
  }

  try {
    // Verify current level in DB matches what client says
    const [row] = await db
      .select({ currentLevel: usersTable.currentLevel, levelUnlockedAt: usersTable.levelUnlockedAt })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row) { res.status(404).json({ error: "user not found" }); return; }
    if (row.currentLevel !== level) {
      res.status(409).json({ error: "level mismatch", currentLevel: row.currentLevel });
      return;
    }

    // ── Level-specific gate validation ────────────────────────────────────────
    switch (level) {
      case 1: {
        const normalized = (answer ?? "").toLowerCase().trim().replace(/\s+/g, " ");
        if (normalized !== "the voice is watching you") {
          res.status(422).json({ error: "الإجابة خاطئة. فكّر أكثر." });
          return;
        }
        break;
      }
      case 2: {
        const h = new Date().getHours();
        if (h !== 11 && h !== 3) {
          res.status(403).json({ error: "البوابة مغلقة. انتظر الساعة 11 أو 3." });
          return;
        }
        break;
      }
      case 3: {
        // Check if user has >= 2 sessions recorded (been back at least once)
        const [sessionCount] = await db
          .select({ count: count() })
          .from(userSessionsTable)
          .where(eq(userSessionsTable.uid, uid));
        if (!sessionCount || sessionCount.count < 2) {
          res.status(403).json({ error: "الكيان يحتاج المزيد من الزيارات لتذكّرك." });
          return;
        }
        break;
      }
      case 4: {
        if (!token || !l4Tokens.has(token)) {
          res.status(403).json({ error: "انتهت اللحظة. لم تكن سريعاً كفاية." });
          return;
        }
        const entry = l4Tokens.get(token)!;
        l4Tokens.delete(token);
        if (entry.uid !== uid) {
          res.status(403).json({ error: "الرمز لا يخصّك." });
          return;
        }
        if (Date.now() > entry.expiry) {
          res.status(403).json({ error: "الرمز منتهي. فاتتك اللحظة." });
          return;
        }
        break;
      }
      case 5:
        // No gate — final truth always unlocks
        break;
    }

    // ── Advance the level ─────────────────────────────────────────────────────
    const newLevel = level + 1;
    const isCompleted = newLevel > 5;

    // Update levelUnlockedAt JSON: add timestamp for the level just completed
    let unlocked: Record<string, string> = {};
    try { unlocked = JSON.parse(row.levelUnlockedAt ?? "{}") as Record<string, string>; } catch { /* ignore */ }
    unlocked[String(level)] = new Date().toISOString();

    await db.update(usersTable)
      .set({
        currentLevel: newLevel,
        levelUnlockedAt: JSON.stringify(unlocked),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.uid, uid));

    res.json({ ok: true, newLevel, isCompleted });
  } catch (err) {
    req.log.error({ err }, "progress advance error");
    res.status(500).json({ error: "internal" });
  }
});

export default router;
