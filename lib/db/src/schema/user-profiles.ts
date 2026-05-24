import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
