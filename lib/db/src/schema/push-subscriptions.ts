import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  tokenType: text("token_type").notNull().default("web"),
  p256dh: text("p256dh"),
  auth: text("auth"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
