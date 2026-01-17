import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- ADRESSEN KONFIGURATION ---

// Live (Base Mainnet) - DEIN NEUER CONTRACT:
const MAINNET_ADDRESS = "0x05c3f0451Fcde74903DF3d08f0fBD15c843FC426"; 

// Dev (Base Sepolia) - DEIN TEST CONTRACT (V12):
const TESTNET_ADDRESS = "0x3fF2CB8779Bad7a87A98Bd61756Fe4b392af855e";

// --- INTELLIGENTE WEICHE ---
// Erkennt automatisch anhand der Domain, wo wir sind.
const isProduction = typeof window !== "undefined" && (window.location.hostname === "aevera.xyz" || window.location.hostname === "www.aevera.xyz");

// Exportiert automatisch die richtige Adresse
export const CONTRACT_ADDRESS = isProduction ? MAINNET_ADDRESS : TESTNET_ADDRESS;

// Debug-Info in der Konsole (damit du siehst, wo du bist)
if (typeof window !== "undefined") {
  console.log(`%c AEVERA MODE: ${isProduction ? "PRODUCTION (Mainnet)" : "DEV (Sepolia)"} `, "background: #222; color: #bada55; font-size: 12px; padding: 4px; border-radius: 4px;");
  console.log("Contract:", CONTRACT_ADDRESS);
}