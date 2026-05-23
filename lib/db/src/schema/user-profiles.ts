import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  uid: text("uid").primaryKey(),
  geoCity: text("geo_city"),
  wish: text("wish"),
  persona: text("persona").default("entity"),
  discoveredRooms: text("discovered_rooms").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const upsertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type UpsertUserProfile = z.infer<typeof upsertUserProfileSchema>;
