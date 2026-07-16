// Puzzle system API — solved puzzles + unlocked achievements persistence
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function isValidUuid(s: unknown): s is string {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof s === "string" && UUID_RE.test(s);
}

function isValidId(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= 64 && /^[a-z0-9_-]+$/i.test(s);
}

// GET /api/arg?uid=xxx — fetch solved puzzles + achievements
router.get("/arg", async (req, res) => {
  const uid = req.query["uid"];
  if (!isValidUuid(uid)) { res.status(400).json({ error: "invalid uid" }); return; }

  try {
    const [row] = await db
      .select({
        solvedPuzzles: usersTable.solvedPuzzles,
        unlockedAchievements: usersTable.unlockedAchievements,
      })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row) { res.status(404).json({ error: "user not found" }); return; }

    res.json({
      solvedPuzzles: row.solvedPuzzles ?? [],
      unlockedAchievements: row.unlockedAchievements ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "arg GET error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/arg/solve — { uid, puzzleId } append solved puzzle (deduped)
router.post("/arg/solve", async (req, res) => {
  const { uid, puzzleId } = req.body as { uid?: string; puzzleId?: string };
  if (!isValidUuid(uid) || !isValidId(puzzleId)) {
    res.status(400).json({ error: "invalid params" });
    return;
  }

  try {
    const [row] = await db
      .select({ solvedPuzzles: usersTable.solvedPuzzles })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row) { res.status(404).json({ error: "user not found" }); return; }

    const current = row.solvedPuzzles ?? [];
    if (!current.includes(puzzleId)) {
      const updated = [...current, puzzleId];
      await db.update(usersTable)
        .set({ solvedPuzzles: updated, updatedAt: new Date() })
        .where(eq(usersTable.uid, uid));
      res.json({ ok: true, solvedPuzzles: updated });
      return;
    }
    res.json({ ok: true, solvedPuzzles: current });
  } catch (err) {
    req.log.error({ err }, "arg solve error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/arg/achievement — { uid, achievementId } append achievement (deduped)
router.post("/arg/achievement", async (req, res) => {
  const { uid, achievementId } = req.body as { uid?: string; achievementId?: string };
  if (!isValidUuid(uid) || !isValidId(achievementId)) {
    res.status(400).json({ error: "invalid params" });
    return;
  }

  try {
    const [row] = await db
      .select({ unlockedAchievements: usersTable.unlockedAchievements })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    if (!row) { res.status(404).json({ error: "user not found" }); return; }

    const current = row.unlockedAchievements ?? [];
    if (!current.includes(achievementId)) {
      const updated = [...current, achievementId];
      await db.update(usersTable)
        .set({ unlockedAchievements: updated, updatedAt: new Date() })
        .where(eq(usersTable.uid, uid));
      res.json({ ok: true, unlockedAchievements: updated });
      return;
    }
    res.json({ ok: true, unlockedAchievements: current });
  } catch (err) {
    req.log.error({ err }, "arg achievement error");
    res.status(500).json({ error: "internal" });
  }
});

export default router;
