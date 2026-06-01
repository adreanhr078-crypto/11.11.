import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  uid: text("uid").primaryKey(),
  name: text("name"),
  geoCity: text("geo_city"),
  wish: text("wish"),
  fear: text("fear"),
  persona: text("persona").default("entity"),
  discoveredRooms: text("discovered_rooms").array().default([]),
  // Device fingerprint for cross-device lookup (non-PII, non-unique, best-effort)
  fingerprint: text("fingerprint"),
  // ARG Progression
  currentLevel: integer("current_level").notNull().default(1),
  levelUnlockedAt: text("level_unlocked_at").notNull().default("{}"),
  // Puzzle system — solved puzzle IDs + unlocked achievement IDs
  solvedPuzzles: text("solved_puzzles").array().default([]),
  unlockedAchievements: text("unlocked_achievements").array().default([]),
  // GameState — persisted so fear/curiosity/trust/level carry across devices
  gameStateFear: integer("game_state_fear").notNull().default(0),
  gameStateCuriosity: integer("game_state_curiosity").notNull().default(0),
  gameStateTrustAI: integer("game_state_trust_ai").notNull().default(0),
  gameStateLevel: integer("game_state_level").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const upsertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type User = typeof usersTable.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
