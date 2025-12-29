import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import nacl from "tweetnacl";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- Standard API Routes ---

  app.post(api.capsules.create.path, async (req, res) => {
    try {
      const input = api.capsules.create.input.parse(req.body);
      // Backend receives pre-encrypted content from frontend
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
      // Auto-decrypt if reveal time has passed
      try {
        const encryptedHex = capsule.encryptedContent;
        const keyHex = capsule.decryptionKey;

        // Convert hex strings back to bytes
        const encryptedBytes = new Uint8Array(
          encryptedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
        const keyBytes = new Uint8Array(
          keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );

        // Extract nonce and ciphertext
        const nonce = encryptedBytes.slice(0, nacl.secretbox.nonceLength);
        const ciphertext = encryptedBytes.slice(nacl.secretbox.nonceLength);

        // Decrypt
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
      // Not yet revealed - return encrypted content
      res.json({
        ...capsule,
        isRevealed: false,
      });
    }
  });

  // --- Farcaster Frame Routes ---

  app.get('/frame/:id', async (req, res) => {
    const idSchema = z.string().uuid();
    const result = idSchema.safeParse(req.params.id);
    
    if (!result.success) {
      return res.status(400).send('Invalid Capsule ID');
    }

    const capsule = await storage.getCapsule(req.params.id);
    if (!capsule) {
      return res.status(404).send('Capsule not found');
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date();
    const revealDate = new Date(capsule.revealDate);
    const isRevealed = now >= revealDate;

    const sealerIdentity = capsule.sealerIdentity || "Someone";
    const timeUntilReveal = (() => {
      const diff = revealDate.getTime() - now.getTime();
      if (diff <= 0) return "Now";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h`;
      return `${hours}h ${mins}m`;
    })();

    const imageUrl = isRevealed 
      ? `https://placehold.co/1200x630?text=TimeCapsule+REVEALED`
      : `https://placehold.co/1200x630?text=TimeCapsule+LOCKED`;

    const ogTitle = isRevealed 
      ? `${sealerIdentity}'s message has been revealed!`
      : `${sealerIdentity} has sent a message to the future!`;
    
    const ogDescription = isRevealed
      ? `A time capsule message was revealed. Read it on TimeCapsule.`
      : `Reveal in ${timeUntilReveal}. Seal your own prophecy on TimeCapsule.`;

    // Proper Farcaster Frame spec (vNext)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${ogTitle}</title>
          <!-- Open Graph -->
          <meta property="og:title" content="${ogTitle}" />
          <meta property="og:description" content="${ogDescription}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:url" content="${baseUrl}/frame/${capsule.id}" />
          
          <!-- Farcaster Frame Specification (vNext) -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          
          <meta property="fc:frame:button:1" content="${isRevealed ? 'View Message' : 'Check Status'}" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:button:1:target" content="${baseUrl}/frame/${capsule.id}" />
          
          ${isRevealed ? `
          <meta property="fc:frame:button:2" content="Mint NFT" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="https://zora.co" />
          ` : ''}
        </head>
        <body>
          <h1>TimeCapsule</h1>
          <p>Status: ${isRevealed ? 'Revealed' : 'Locked'}</p>
          <p>Reveal Date: ${revealDate.toUTCString()}</p>
        </body>
      </html>
    `;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  app.post('/frame/:id', async (req, res) => {
    const idSchema = z.string().uuid();
    const result = idSchema.safeParse(req.params.id);
    
    if (!result.success) {
       return res.status(400).json({ message: 'Invalid Capsule ID' });
    }

    const capsule = await storage.getCapsule(req.params.id);
    if (!capsule) {
      return res.status(404).json({ message: 'Capsule not found' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const now = new Date();
    const revealDate = new Date(capsule.revealDate);
    const isRevealed = now >= revealDate;

    const imageUrl = isRevealed 
      ? `https://placehold.co/1200x630?text=TimeCapsule+REVEALED`
      : `https://placehold.co/1200x630?text=TimeCapsule+LOCKED`;

    // Farcaster Frame Response (vNext)
    res.json({
      version: "vNext",
      image: imageUrl,
      imageAspectRatio: "1.91:1",
      buttons: isRevealed 
        ? [
            {
              label: "View Message",
              action: "post",
              target: `${baseUrl}/frame/${capsule.id}`
            },
            {
              label: "Mint NFT",
              action: "link",
              target: "https://zora.co"
            }
          ]
        : [
            {
              label: "Check Again Later",
              action: "post",
              target: `${baseUrl}/frame/${capsule.id}`
            }
          ]
    });
  });

  return httpServer;
}
