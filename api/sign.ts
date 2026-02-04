import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { createWalletClient, http, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains'; // <--- WICHTIG: base statt baseSepolia

// Dein Backend-Wallet Private Key (wird aus Environment geladen)
// ACHTUNG: Dieser Key muss zu der Adresse gehören, die du im Smart Contract als 'signer' hinterlegt hast!
const PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY as `0x${string}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Sicherheit: Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, authorName } = req.body;

    if (!userAddress || !authorName) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (!PRIVATE_KEY) {
      console.error("Server Error: Private Key missing");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 2. Initialisiere den "Notar" (Backend Wallet)
    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: base, // <--- UPDATE: Mainnet
      transport: http(),
    });

    // 3. Erstelle den Hash exakt so wie der Smart Contract
    // Solidity: keccak256(abi.encodePacked(sender, name))
    const messageHash = keccak256(
      encodePacked(['address', 'string'], [userAddress, authorName])
    );

    // 4. Unterschreibe den Hash
    // Wir nutzen signMessage mit { raw: ... }, da der Contract toEthSignedMessageHash nutzt
    const signature = await client.signMessage({
      message: { raw: messageHash },
    });

    console.log(`✅ Signed for ${userAddress}: ${authorName}`);

    // 5. Sende die Unterschrift zurück ans Frontend
    return res.status(200).json({ signature });

  } catch (error) {
    console.error("Signing Error:", error);
    return res.status(500).json({ error: 'Signing failed' });
  }
}