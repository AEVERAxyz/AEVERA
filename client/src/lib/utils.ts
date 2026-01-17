// client/src/lib/utils.ts
// Update V8.6: Contract Address update (Verified Contract)

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Class Mergers (Standard Shadcn Utils)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AEVERA CONFIGURATION
// V8.6 Verified Contract (Base64 Fix + Narrative Update + Stack Optimization)
export const CONTRACT_ADDRESS = "0x3fF2CB8779Bad7a87A98Bd61756Fe4b392af855e";

// Source 63: Network Base (Layer 2) - Chain ID für Base Sepolia
export const CHAIN_ID = 84532; 

// Helper für Short-IDs (Source 77)
export function formatShortId(uuid: string): string {
    if (!uuid) return "";
    return "#" + uuid.slice(0, 7).toUpperCase();
}