import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userSessionsTable = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(),
  userAgent: text("user_agent"),
  city: text("city"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSessionSchema = createInsertSchema(userSessionsTable).omit({
  id: true,
  startedAt: true,
});

export type UserSession = typeof userSessionsTable.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
