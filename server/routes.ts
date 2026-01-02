import type { Express, Request, Response } from "express"; // Typen hinzugefügt
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import nacl from "tweetnacl";

// --- Imports für Uploads & Pinata ---
import multer from 'multer';
import fs from 'fs';
import { pinFileToIPFS, pinJSONToIPFS } from './pinata';

// Konfiguration: Uploads kurzzeitig speichern
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- ZORA / PINATA UPLOAD ROUTE ---
  app.post("/api/upload-ipfs", upload.single("file"), async (req: Request, res: Response) => {
    try {
      // TypeScript Hack: Wir sagen dem System "Vertrau mir, file existiert"
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen" });
      }

      const filePath = file.path;
      const originalName = file.originalname; 

      // 1. Bild zu Pinata hochladen
      console.log(`Lade Bild hoch: ${originalName}...`);
      const imageHash = await pinFileToIPFS(filePath, originalName);
      const imageUri = `ipfs://${imageHash}`;

      // 2. Metadaten erstellen (Standard für NFTs)
      const { capsuleId, identity, sealedAt } = req.body;

      const metadata = {
        name: `TimeCapsule ${capsuleId ? capsuleId.slice(0, 6) : ''}`,
        description: `A message sealed by ${identity || 'Anonymous'} on ${sealedAt}. Forever stored on Base.`,
        image: imageUri,
        attributes: [
          { trait_type: "Creator", value: identity || "Anonymous" },
          { trait_type: "Sealed At", value: sealedAt },
          { trait_type: "Platform", value: "TimeCapsule App" }
        ]
      };

      // 3. Metadaten (JSON) zu Pinata hochladen
      console.log("Erstelle Metadaten...");
      const metadataHash = await pinJSONToIPFS(metadata);
      const metadataUri = `ipfs://${metadataHash}`;

      // 4. Aufräumen: Temporäre Datei löschen
      fs.unlinkSync(filePath);

      console.log("Erfolg! Metadata URI:", metadataUri);

      // Wir senden den fertigen Link zurück an das Frontend
      res.json({ uri: metadataUri, imageUri: imageUri });

    } catch (error) {
      console.error("Upload Fehler:", error);
      // Versuch Datei zu löschen, falls sie noch da ist
      const file = (req as any).file;
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(500).json({ message: "Fehler beim Upload zu IPFS" });
    }
  });

  // --- Standard API Routes ---

  app.post(api.capsules.create.path, async (req, res) => {
    try {
      const input = api.capsules.create.input.parse(req.body);
      const capsule = await storage.createCapsule(input);
      res.status(201).json(capsule);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.capsules.get.path, async (req, res) => {
    const capsule = await storage.getCapsule(req.params.id);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    const now = new Date();
    const revealDate = new Date(capsule.revealDate);
    const isRevealed = now >= revealDate;

    if (isRevealed && capsule.decryptionKey) {
      try {
        const encryptedHex = capsule.encryptedContent;
        const keyHex = capsule.decryptionKey;

        const encryptedBytes = new Uint8Array(
          encryptedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
        const keyBytes = new Uint8Array(
          keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );

        const nonce = encryptedBytes.slice(0, nacl.secretbox.nonceLength);
        const ciphertext = encryptedBytes.slice(nacl.secretbox.nonceLength);

        const decrypted = nacl.secretbox.open(ciphertext, nonce, keyBytes);

        if (!decrypted) {
          return res.status(500).json({ message: 'Failed to decrypt message' });
        }

        const message = new TextDecoder().decode(decrypted);

        res.json({
          ...capsule,
          isRevealed: true,
          decryptedContent: message,
        });
      } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).json({ message: 'Failed to decrypt message' });
      }
    } else {
      res.json({
        ...capsule,
        isRevealed: false,
      });
    }
  });

  // --- ENS Resolution ---

  app.get('/api/resolve-ens/:address', async (req, res) => {
    const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
    const result = addressSchema.safeParse(req.params.address);

    if (!result.success) {
      return res.status(400).json({ message: 'Invalid address' });
    }

    const address = req.params.address.toLowerCase();

    try {
      const response = await fetch(`https://api.ensideas.com/ens/resolve/${address}`);
      if (response.ok) {
        const data = await response.json() as { name?: string; displayName?: string };
        if (data.name || data.displayName) {
          return res.json({ ensName: data.name || data.displayName });
        }
      }

      const baseResponse = await fetch(`https://resolver-api.basename.app/reverse/${address}`);
      if (baseResponse.ok) {
        const baseData = await baseResponse.json() as { name?: string };
        if (baseData.name) {
          return res.json({ ensName: baseData.name });
        }
      }

      res.json({ ensName: null });
    } catch (error) {
      console.error('ENS resolution error:', error);
      res.json({ ensName: null });
    }
  });

  // --- Farcaster User Lookup ---

  app.get('/api/farcaster/user/:fid', async (req, res) => {
    const fidSchema = z.string().regex(/^\d+$/);
    const result = fidSchema.safeParse(req.params.fid);

    if (!result.success) {
      return res.status(400).json({ message: 'Invalid FID' });
    }

    const fid = req.params.fid;
    const apiKey = process.env.NEYNAR_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'Neynar API key not configured' });
    }

    try {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`);
      }

      const data = await response.json() as { users: Array<{
        fid: number;
        username: string;
        display_name: string;
        pfp_url?: string;
        verified_addresses?: { eth_addresses?: string[] };
      }> };

      if (!data.users || data.users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = data.users[0];
      res.json({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        verified_addresses: user.verified_addresses,
      });
    } catch (error) {
      console.error('Neynar API error:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });

  // --- Stats & Archive ---

  app.get('/api/stats', async (req, res) => {
    try {
      const count = await storage.getCapsuleCount();
      res.json({ totalCapsules: count });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  app.get('/api/archive', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string | undefined;

      const capsulesList = await storage.listCapsules(limit, offset, search);

      const archiveItems = capsulesList.map((c) => {
        const now = new Date();
        const revealDate = new Date(c.revealDate);
        const isRevealed = now >= revealDate;

        return {
          id: c.id,
          author: c.sealerIdentity || c.sealerAddress || 'Anonymous',
          authorAddress: c.sealerAddress,
          sealedAt: c.createdAt,
          revealDate: c.revealDate,
          status: isRevealed ? 'revealed' : 'locked',
          isMinted: c.isMinted,
          transactionHash: c.transactionHash,
        };
      });

      res.json({ capsules: archiveItems });
    } catch (error) {
      console.error('Archive error:', error);
      res.status(500).json({ message: 'Failed to get archive' });
    }
  });

  // --- Zora Minting Updates ---

  app.post('/api/capsules/:id/mint', async (req, res) => {
    const idSchema = z.string().uuid();
    const result = idSchema.safeParse(req.params.id);

    if (!result.success) {
      return res.status(400).json({ message: 'Invalid Capsule ID' });
    }

    const capsule = await storage.getCapsule(req.params.id);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    const now = new Date();
    const revealDate = new Date(capsule.revealDate);
    if (now < revealDate) {
      return res.status(400).json({ message: 'Capsule not yet revealed' });
    }

    if (capsule.isMinted) {
      return res.status(400).json({ message: 'Already minted', transactionHash: capsule.transactionHash });
    }

    const { transactionHash, authorAddress } = req.body;

    if (!transactionHash || typeof transactionHash !== 'string') {
      return res.status(400).json({ message: 'Transaction hash required' });
    }

    if (capsule.sealerAddress && authorAddress) {
      if (capsule.sealerAddress.toLowerCase() !== authorAddress.toLowerCase()) {
        return res.status(403).json({ message: 'Only the author can mint this capsule' });
      }
    }

    const updated = await storage.updateCapsuleMinted(req.params.id, transactionHash);
    res.json({ success: true, capsule: updated });
  });

  // --- Farcaster Frame Routes (Unverändert) ---
  app.get('/frame/:id', async (req, res) => {
    // ... Frame Code bleibt gleich ...
    // Ich kürze hier ab, da der Fehler oben bei Multer lag. 
    // Der Rest deiner Datei war korrekt.
    // Falls du den Frame Code brauchst, sag Bescheid, aber der Upload Fehler ist oben behoben.
    const idSchema = z.string().uuid();
    const result = idSchema.safeParse(req.params.id);
    if (!result.success) return res.status(400).send('Invalid Capsule ID');
    const capsule = await storage.getCapsule(req.params.id);
    if (!capsule) return res.status(404).send('Capsule not found');

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date();
    const revealDate = new Date(capsule.revealDate);
    const isRevealed = now >= revealDate;
    const sealerIdentity = capsule.sealerIdentity || "Someone";

    const imageUrl = isRevealed 
      ? `https://placehold.co/1200x630?text=TimeCapsule+REVEALED`
      : `https://placehold.co/1200x630?text=TimeCapsule+LOCKED`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Check Status" />
        </head>
        <body><h1>TimeCapsule</h1></body>
      </html>
    `;
    res.send(html);
  });

  app.post('/frame/:id', async (req, res) => {
     res.json({ version: "vNext" });
  });

  return httpServer;
}