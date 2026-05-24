import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  tokenType: text("token_type").notNull().default("web"),
  p256dh: text("p256dh"),
  auth: text("auth"),
  // Bitmask: bit0=11:11 (1), bit1=23:11 (2), bit2=3:33 (4). Default 7 = all on.
  // 3:33 (bit2) is always sent by the server regardless of user preference.
  scheduleMask: integer("schedule_mask").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
