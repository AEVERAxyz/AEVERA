import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const capsules = pgTable("capsules", {
  id: uuid("id").primaryKey().defaultRandom(),
  encryptedContent: text("encrypted_content").notNull(),
  messageHash: text("message_hash").notNull(),
  revealDate: timestamp("reveal_date").notNull(),
  transactionHash: text("transaction_hash"),
  isMinted: boolean("is_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapsuleSchema = createInsertSchema(capsules).pick({
  encryptedContent: true,
  messageHash: true,
  revealDate: true,
});

export type InsertCapsule = z.infer<typeof insertCapsuleSchema>;
export type Capsule = typeof capsules.$inferSelect;

export type CreateCapsuleRequest = InsertCapsule;
export type CapsuleResponse = Capsule;
