import { db } from "./db";
import { capsules, type CreateCapsuleRequest, type Capsule } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createCapsule(capsule: CreateCapsuleRequest): Promise<Capsule>;
  getCapsule(id: string): Promise<Capsule | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createCapsule(capsule: CreateCapsuleRequest): Promise<Capsule> {
    const [newCapsule] = await db.insert(capsules).values(capsule).returning();
    return newCapsule;
  }

  async getCapsule(id: string): Promise<Capsule | undefined> {
    const [capsule] = await db.select().from(capsules).where(eq(capsules.id, id));
    return capsule;
  }
}

export const storage = new DatabaseStorage();
