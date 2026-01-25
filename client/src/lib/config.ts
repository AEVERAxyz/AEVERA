import { base, baseSepolia } from 'wagmi/chains';

// --- UMWELT-ERKENNUNG ---
const isTestnet =
  typeof window !== "undefined" && 
  (window.location.hostname.includes("testnet") || 
   window.location.hostname.includes("dev") || 
   window.location.hostname.includes("replit") ||
   window.location.hostname.includes("localhost"));

// --- SECRET EXTRACTION ---
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || "";

// --- RPC LISTEN (DAS TELEFONBUCH) ---
// Hier definieren wir die Ausweich-Server zentral
const MAINNET_RPCS = [
  "https://mainnet.base.org",
  "https://base.llamarpc.com",
  "https://base-mainnet.public.blastapi.io", 
  "https://1rpc.io/base",
  "https://base.meowrpc.com"
];

const SEPOLIA_RPCS = [
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
  "https://base-sepolia.blockpi.network/v1/rpc/public"
];

// --- KONFIGURATION (Das Gehirn) ---
export const APP_CONFIG = {
  IS_TESTNET: isTestnet,

  // Bestimmt das aktive Netzwerk
  ACTIVE_CHAIN: isTestnet ? baseSepolia : base,

  // Zentrale Contract-Steuerung
  CONTRACT_ADDRESS: isTestnet 
    ? "0xF5dD7192fCB0e3025ef35d57ec189cd02a944B7B" 
    : "0xCa6a0b15ffB34680B5035A14B27909D134E07287",

  EXPLORER_URL: isTestnet ? "https://sepolia.basescan.org" : "https://basescan.org",

  // --- TRANSPORT-LAYER ---

  // 1. INTELLIGENTE RPC LISTE (NEU!)
  // Die App muss nicht mehr raten. Sie nimmt einfach diese Liste.
  RPC_LIST: isTestnet ? SEPOLIA_RPCS : MAINNET_RPCS,

  // Legacy Feld (falls noch irgendwo einzeln gebraucht)
  PUBLIC_RPC_URL: isTestnet 
    ? "https://sepolia.base.org" 
    : "https://mainnet.base.org",

  // 2. WALLET TRANSPORT URL (Privat & Gesichert)
  WALLET_TRANSPORT_URL: isTestnet
    ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,

  // --- IDENTITY TELESCOPE ---
  BASE_IDENTITY_URL: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  ETH_IDENTITY_URL: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, 

  // --- APP LIMITS ---
  MAX_SUPPLY_PUBLIC: 100,
  MAX_SUPPLY_PRIVATE: 1000
} as const;