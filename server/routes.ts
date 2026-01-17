import type { Express } from "express";
import type { Server } from "http";

// KORREKTUR: Wir akzeptieren wieder BEIDE Argumente (Server und App),
// damit index.ts nicht abstürzt.
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // Minimaler Health-Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", mode: "blockchain-only" });
  });

  // Wir geben einfach den Server zurück, der uns übergeben wurde.
  return httpServer;
}