import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatHistoryTable = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertChatHistorySchema = createInsertSchema(chatHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type ChatHistoryEntry = typeof chatHistoryTable.$inferSelect;
export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
