import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Wir holen den Schlüssel sicher aus den Secrets
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.warn("WARNUNG: Kein PINATA_JWT in den Secrets gefunden. Uploads werden fehlschlagen.");
}

export async function pinFileToIPFS(filePath: string, fileName: string) {
  try {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);

    formData.append('file', file);

    const metadata = JSON.stringify({
      name: fileName,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    // Das ist der Hash (die Adresse) des Bildes im IPFS
    return res.data.IpfsHash;
  } catch (error) {
    console.error("Fehler beim Upload zu Pinata:", error);
    throw error;
  }
}

export async function pinJSONToIPFS(body: any) {
  try {
    const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      pinataContent: body,
      pinataMetadata: {
        name: body.name || "TimeCapsule Metadata"
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    return res.data.IpfsHash;
  } catch (error) {
    console.error("Fehler beim JSON Upload zu Pinata:", error);
    throw error;
  }
}