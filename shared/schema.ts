import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const capsules = pgTable("capsules", {
  id: uuid("id").primaryKey().defaultRandom(),
  encryptedContent: text("encrypted_content").notNull(),
  decryptionKey: text("decryption_key").notNull(),
  messageHash: text("message_hash").notNull(),
  revealDate: timestamp("reveal_date").notNull(),
  sealerIdentity: text("sealer_identity"),
  sealerType: text("sealer_type"),
  sealerAddress: text("sealer_address"),
  transactionHash: text("transaction_hash"),
  isMinted: boolean("is_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCapsuleSchema = createInsertSchema(capsules)
  .pick({
    encryptedContent: true,
    decryptionKey: true,
    messageHash: true,
    revealDate: true,
    sealerIdentity: true,
    sealerType: true,
    sealerAddress: true,
  })
  .extend({
    revealDate: z.coerce.date(),
    sealerIdentity: z.string().optional(),
    sealerType: z.string().optional(),
    sealerAddress: z.string().optional(),
  });

export type InsertCapsule = z.infer<typeof insertCapsuleSchema>;
export type Capsule = typeof capsules.$inferSelect;

export type CreateCapsuleRequest = InsertCapsule;
export type CapsuleResponse = Capsule;
