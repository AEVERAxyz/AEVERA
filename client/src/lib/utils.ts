import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getName } from '@coinbase/onchainkit/identity';
import { base, mainnet } from 'viem/chains';
import { createPublicClient, http } from 'viem';

// --- ZENTRALE CONFIG IMPORTIEREN ---
import { APP_CONFIG } from "./config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Punkt 2: Zentrale Adresse aus der config.ts
export const CONTRACT_ADDRESS = APP_CONFIG.CONTRACT_ADDRESS;

/**
 * IDENTITY TELESCOPE: Standleitung zum Ethereum Mainnet für ENS.
 * Punkt 4: Nutzt Alchemy exklusiv für Identität.
 */
export const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(APP_CONFIG.ETH_IDENTITY_URL)
});

/**
 * Holt den verifizierten Base-Namen (L2) via OnchainKit.
 * FIXED: 'as any' löst den Versions-Konflikt zwischen viem und OnchainKit in Replit.
 */
export async function getVerifiedBaseName(address: string) {
  if (!address) return null;
  try {
    return await getName({
      address: address as `0x${string}`,
      chain: base as any // Der Fix für den TypeScript-Error
    });
  } catch (e) {
    return null;
  }
}

/**
 * Holt den verifizierten ENS-Namen (L1) via dediziertem ethClient.
 */
export async function getVerifiedEnsName(address: string) {
  if (!address) return null;
  try {
    return await ethClient.getEnsName({
      address: address as `0x${string}`
    });
  } catch (e) {
    return null;
  }
}