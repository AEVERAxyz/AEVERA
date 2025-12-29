import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
    
    // Only return content if revealed
    if (new Date() < new Date(capsule.revealDate)) {
       return res.json({ ...capsule, content: "Locked until " + capsule.revealDate });
    }

    res.json(capsule);
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

    // Basic HTML with Frame Metadata
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    
    // For MVP, using a placeholder image service or static image
    const imageUrl = `https://placehold.co/600x400?text=TimeCapsule+Locked`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TimeCapsule</title>
          <meta property="og:title" content="TimeCapsule" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Reveal Message" />
          <meta property="fc:frame:post_url" content="${baseUrl}/frame/${capsule.id}" />
        </head>
        <body>
          <h1>TimeCapsule</h1>
          <p>This message is locked until ${new Date(capsule.revealDate).toLocaleString()}</p>
        </body>
      </html>
    `;
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

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const now = new Date();
    const revealDate = new Date(capsule.revealDate);

    const isRevealed = now >= revealDate;

    let imageUrl;
    let buttonText;
    let messageText;

    if (isRevealed) {
       // Revealed state
       // We need to render the text into the image or return a new image
       // For MVP, we'll use placehold.co with the text if it fits, or just "REVEALED"
       // Real implementation would use @vercel/og or similar to generate image
       const safeContent = encodeURIComponent(capsule.content.substring(0, 50)); // Truncate for URL safety in placeholder
       imageUrl = `https://placehold.co/600x400?text=${safeContent}`;
       buttonText = "Mint as NFT (Coming Soon)";
       messageText = `Revealed: ${capsule.content}`;
    } else {
       // Still locked
       const timeLeft = Math.ceil((revealDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)); // Days
       imageUrl = `https://placehold.co/600x400?text=Locked+for+${timeLeft}+more+days`;
       buttonText = "Check Again Later";
       messageText = "Still locked!";
    }

    // Return Frame Response
    res.json({
      version: "vNext",
      image: imageUrl,
      buttons: [
        {
          label: buttonText,
        },
      ],
      // If we wanted to link to mint, we'd use 'link' action or a mint transaction
    });
  });

  return httpServer;
}
