import { Router } from "express";
import { db, userProfilesTable, chatHistoryTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/user/profile", async (req, res) => {
  try {
    const uid = req.query["uid"];
    if (!uid || typeof uid !== "string" || uid.length > 128) {
      res.status(400).json({ error: "invalid uid" });
      return;
    }

    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.uid, uid));

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

    const updateFields: Partial<typeof userProfilesTable.$inferInsert> = {};
    if (geoCity !== undefined) updateFields.geoCity = geoCity ?? null;
    if (wish !== undefined) updateFields.wish = wish ?? null;
    if (persona !== undefined) updateFields.persona = persona;
    if (discoveredRooms !== undefined) updateFields.discoveredRooms = discoveredRooms;

    await db
      .insert(userProfilesTable)
      .values({
        uid,
        geoCity: geoCity ?? null,
        wish: wish ?? null,
        persona: persona ?? "entity",
        discoveredRooms: discoveredRooms ?? [],
      })
      .onConflictDoUpdate({
        target: userProfilesTable.uid,
        set: { ...updateFields, updatedAt: new Date() },
      });

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "user profile POST error");
    res.status(500).json({ error: "internal" });
  }
});

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
