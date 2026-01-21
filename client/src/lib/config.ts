import { base, baseSepolia } from 'wagmi/chains';

// --- UMWELT-ERKENNUNG ---
const isTestnet =
  typeof window !== "undefined" && 
  (window.location.hostname.includes("testnet") || 
   window.location.hostname.includes("dev") || 
   window.location.hostname.includes("replit"));

// --- SECRET EXTRACTION ---
// Wir holen nur den Schlüssel aus dem Tresor.
// Der Code baut die Links dann unten selbst zusammen.
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || "";

// --- KONFIGURATION (Das Gehirn) ---
export const APP_CONFIG = {
  IS_TESTNET: isTestnet,

  // Bestimmt das aktive Netzwerk für die Wallet-Verbindung
  ACTIVE_CHAIN: isTestnet ? baseSepolia : base,

  // Zentrale Contract-Steuerung
  CONTRACT_ADDRESS: isTestnet 
    ? "0xF5dD7192fCB0e3025ef35d57ec189cd02a944B7B" 
    : "0xCa6a0b15ffB34680B5035A14B27909D134E07287",

  EXPLORER_URL: isTestnet ? "https://sepolia.basescan.org" : "https://basescan.org",

  // --- TRANSPORT-LAYER ---

  // 1. PUBLIC RPC (Kostenlos, keine Gefahr)
  PUBLIC_RPC_URL: isTestnet 
    ? "https://sepolia.base.org" 
    : "https://mainnet.base.org",

  // 2. WALLET TRANSPORT URL (Privat & Gesichert)
  // Hier setzen wir den Schlüssel dynamisch ein.
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