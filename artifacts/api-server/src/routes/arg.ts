// Puzzle system API — solved puzzles + unlocked achievements persistence
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthenticatedRequest } from "../middleware/authenticate";

const router = Router();

function isValidUuid(s: unknown): s is string {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof s === "string" && UUID_RE.test(s);
}

function isValidId(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= 64 && /^[a-z0-9_-]+$/i.test(s);
}

// GET /api/arg — fetch solved puzzles + achievements
router.get("/arg", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

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

// POST /api/arg/sync — full sync of solved puzzles + achievements + gameState
router.post("/arg/sync", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  const { solvedPuzzles, unlockedAchievements, gameState } = req.body as {
    solvedPuzzles?: string[];
    unlockedAchievements?: string[];
    gameState?: { fear?: number; curiosity?: number; trustAI?: number; level?: number };
  };

  if (!Array.isArray(solvedPuzzles) || !Array.isArray(unlockedAchievements)) {
    res.status(400).json({ error: "invalid payload" });
    return;
  }

  try {
    const [row] = await db
      .select({
        solvedPuzzles: usersTable.solvedPuzzles,
        unlockedAchievements: usersTable.unlockedAchievements,
        gameStateFear: usersTable.gameStateFear,
        gameStateCuriosity: usersTable.gameStateCuriosity,
        gameStateTrustAI: usersTable.gameStateTrustAI,
        gameStateLevel: usersTable.gameStateLevel,
      })
      .from(usersTable)
      .where(eq(usersTable.uid, uid));

    const currentSolved = row?.solvedPuzzles ?? [];
    const currentAch = row?.unlockedAchievements ?? [];
    const mergedSolved = Array.from(new Set([...currentSolved, ...solvedPuzzles]));
    const mergedAch = Array.from(new Set([...currentAch, ...unlockedAchievements]));

    const clamp = (v: number | undefined, min: number, max: number, def: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : def;

    const fear = clamp(gameState?.fear, 0, 10, row?.gameStateFear ?? 0);
    const curiosity = clamp(gameState?.curiosity, 0, 10, row?.gameStateCuriosity ?? 0);
    const trustAI = clamp(gameState?.trustAI, 0, 10, row?.gameStateTrustAI ?? 0);
    const level = clamp(gameState?.level, 1, 5, row?.gameStateLevel ?? 1);

    await db
      .insert(usersTable)
      .values({
        uid,
        solvedPuzzles: mergedSolved,
        unlockedAchievements: mergedAch,
        gameStateFear: fear,
        gameStateCuriosity: curiosity,
        gameStateTrustAI: trustAI,
        gameStateLevel: level,
      })
      .onConflictDoUpdate({
        target: usersTable.uid,
        set: {
          solvedPuzzles: mergedSolved,
          unlockedAchievements: mergedAch,
          gameStateFear: fear,
          gameStateCuriosity: curiosity,
          gameStateTrustAI: trustAI,
          gameStateLevel: level,
          updatedAt: new Date(),
        },
      });

    res.json({ ok: true, solvedPuzzles: mergedSolved, unlockedAchievements: mergedAch });
  } catch (err) {
    req.log.error({ err }, "arg sync error");
    res.status(500).json({ error: "internal" });
  }
});

// POST /api/arg/solve — { puzzleId } append solved puzzle (deduped)
router.post("/arg/solve", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  const { puzzleId } = req.body as { puzzleId?: string };
  if (!isValidId(puzzleId)) {
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

// POST /api/arg/achievement — { achievementId } append achievement (deduped)
router.post("/arg/achievement", async (req: AuthenticatedRequest, res) => {
  const uid = req.uid;
  if (!uid) { res.status(401).json({ error: "unauthorized" }); return; }

  const { achievementId } = req.body as { achievementId?: string };
  if (!isValidId(achievementId)) {
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
