import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const capsules = pgTable("capsules", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  revealDate: timestamp("reveal_date").notNull(),
  transactionHash: text("transaction_hash"),
  isMinted: boolean("is_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapsuleSchema = createInsertSchema(capsules).pick({
  content: true,
  revealDate: true,
});

export type InsertCapsule = z.infer<typeof insertCapsuleSchema>;
export type Capsule = typeof capsules.$inferSelect;

export type CreateCapsuleRequest = InsertCapsule;
export type CapsuleResponse = Capsule;
