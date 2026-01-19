import { base, baseSepolia } from 'wagmi/chains';
// Der Import von 'http' wurde entfernt, da wir hier nur die URL-Strings definieren.

// --- UMWELT-ERKENNUNG ---
// Erkennt automatisch, ob wir im Testnet (Replit/Dev) oder Mainnet sind.
const isTestnet = false;
  typeof window !== "undefined" && 
  (window.location.hostname.includes("testnet") || 
   window.location.hostname.includes("dev") || 
   window.location.hostname.includes("replit"));

// --- KONFIGURATION (Das Gehirn) ---
export const APP_CONFIG = {
  IS_TESTNET: isTestnet,

  // Bestimmt das aktive Netzwerk für die Wallet-Verbindung
  ACTIVE_CHAIN: isTestnet ? baseSepolia : base,

  // Zentrale Contract-Steuerung (Punkt 2)
  CONTRACT_ADDRESS: isTestnet 
    ? "0xF5dD7192fCB0e3025ef35d57ec189cd02a944B7B" 
    : "0xCa6a0b15ffB34680B5035A14B27909D134E07287",

  EXPLORER_URL: isTestnet ? "https://sepolia.basescan.org" : "https://basescan.org",

  // --- TRANSPORT-LAYER (Punkt 4: Hybrid-Architektur) ---

  // 1. PUBLIC RPC (Für Massendaten/Tabellen/Logs)
  // Dies schont dein Alchemy-Kontingent und ist kostenlos.
  PUBLIC_RPC_URL: isTestnet 
    ? "https://sepolia.base.org" 
    : "https://mainnet.base.org",

  // 2. WALLET TRANSPORT URL (Für Transaktionen/Minting)
  // Wird in OnchainProviders.tsx in http() eingepackt.
  WALLET_TRANSPORT_URL: isTestnet
    ? "https://base-sepolia.g.alchemy.com/v2/hFxU2M2sLj8BqUsGvgwOp"
    : "https://base-mainnet.g.alchemy.com/v2/hFxU2M2sLj8BqUsGvgwOp",

  // --- IDENTITY TELESCOPE (NUR für Alchemy Identitäts-Check) ---
  // Masterplan 10.1: Konsolidierter Key für alle Identity-Abfragen.
  BASE_IDENTITY_URL: "https://base-mainnet.g.alchemy.com/v2/hFxU2M2sLj8BqUsGvgwOp",
  ETH_IDENTITY_URL: "https://eth-mainnet.g.alchemy.com/v2/hFxU2M2sLj8BqUsGvgwOp", 

  // --- APP LIMITS ---
  MAX_SUPPLY_PUBLIC: 100,
  MAX_SUPPLY_PRIVATE: 1000
} as const;