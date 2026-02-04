import express from 'express';
import cors from 'cors';
import { createWalletClient, http, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Initialisiere den lokalen Server
const app = express();
app.use(express.json());
app.use(cors());

// Lade den Key aus den Replit Secrets
const PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;

// Der API Endpunkt (genau wie bei Vercel)
app.post('/api/sign', async (req, res) => {
  try {
    const { userAddress, authorName } = req.body;

    if (!PRIVATE_KEY) {
      console.error("❌ FEHLER: BACKEND_PRIVATE_KEY fehlt in Secrets!");
      return res.status(500).json({ error: 'Server Config Error' });
    }

    console.log(`✍️  Signiere lokal für: ${authorName} (${userAddress})`);

    // 1. Account erstellen
    const account = privateKeyToAccount(PRIVATE_KEY);

    // 2. Client erstellen
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    // 3. Hash erstellen (genau wie im Smart Contract)
    const messageHash = keccak256(
      encodePacked(['address', 'string'], [userAddress, authorName])
    );

    // 4. Unterschreiben
    const signature = await client.signMessage({
      message: { raw: messageHash },
    });

    console.log(`✅ Unterschrift erstellt: ${signature.slice(0, 20)}...`);

    // 5. Zurücksenden
    res.json({ signature });

  } catch (error) {
    console.error("❌ Signier-Fehler:", error);
    res.status(500).json({ error: 'Signing failed' });
  }
});

// Server starten auf Port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Lokaler Signier-Server läuft auf http://localhost:${PORT}`);
});