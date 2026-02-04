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

// UPDATE V2: Wir exportieren jetzt beide Adressen für Hooks
export const GATEWAY_ADDRESS = APP_CONFIG.GATEWAY_ADDRESS;
export const VAULT_ADDRESS = APP_CONFIG.VAULT_ADDRESS;
export const USDC_ADDRESS = APP_CONFIG.USDC_ADDRESS;

/**
 * IDENTITY TELESCOPE: Standleitung zum Ethereum Mainnet für ENS.
 */
export const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(APP_CONFIG.ETH_IDENTITY_URL)
});

export async function getVerifiedBaseName(address: string) {
  if (!address) return null;
  try {
    return await getName({
      address: address as `0x${string}`,
      chain: base as any 
    });
  } catch (e) {
    return null;
  }
}

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