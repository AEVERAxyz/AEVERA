import { db } from "./db";
import { capsules, type CreateCapsuleRequest, type Capsule } from "@shared/schema";
import { eq, sql, desc, ilike, or } from "drizzle-orm";

export interface IStorage {
  createCapsule(capsule: CreateCapsuleRequest): Promise<Capsule>;
  getCapsule(id: string): Promise<Capsule | undefined>;
  getCapsuleCount(): Promise<number>;
  listCapsules(limit?: number, offset?: number, search?: string): Promise<Capsule[]>;
  updateCapsuleMinted(id: string, transactionHash: string): Promise<Capsule | undefined>;
}

// Simple Prüfung: Ist die ID lang genug für eine UUID? (36 Zeichen)
// Ethereum Adressen sind 42 Zeichen lang.
function isUUID(uuid: string) {
  return typeof uuid === 'string' && uuid.length === 36;
}

export class DatabaseStorage implements IStorage {
  async createCapsule(capsule: CreateCapsuleRequest): Promise<Capsule> {
    const [newCapsule] = await db.insert(capsules).values(capsule).returning();
    return newCapsule;
  }

  async getCapsule(id: string): Promise<Capsule | undefined> {
    try {
      // Wenn es KEINE UUID ist (falsche Länge), suchen wir in den Textfeldern
      if (!isUUID(id)) {
        const [capsule] = await db.select().from(capsules).where(
          or(
            ilike(capsules.transactionHash, id),
            ilike(capsules.messageHash, id)
          )
        );
        return capsule;
      }
      // Sonst normale Suche
      const [capsule] = await db.select().from(capsules).where(eq(capsules.id, id));
      return capsule;
    } catch (error) {
      console.error("Storage Error:", error);
      return undefined;
    }
  }

  async getCapsuleCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(capsules);
    return result[0]?.count ?? 0;
  }

  async listCapsules(limit = 50, offset = 0, search?: string): Promise<Capsule[]> {
    let query = db.select().from(capsules);
    if (search) {
      query = query.where(or(ilike(capsules.sealerIdentity, `%${search}%`), ilike(capsules.sealerAddress, `%${search}%`))) as typeof query;
    }
    return query.orderBy(desc(capsules.createdAt)).limit(limit).offset(offset);
  }

  async updateCapsuleMinted(id: string, transactionHash: string): Promise<Capsule | undefined> {
    try {
        if (!isUUID(id)) {
           const [updated] = await db.update(capsules).set({ isMinted: true, transactionHash })
            .where(or(ilike(capsules.transactionHash, id), ilike(capsules.messageHash, id))).returning();
           return updated;
        }
        const [updated] = await db.update(capsules).set({ isMinted: true, transactionHash })
          .where(eq(capsules.id, id)).returning();
        return updated;
    } catch(e) { return undefined; }
  }
}

export const storage = new DatabaseStorage();