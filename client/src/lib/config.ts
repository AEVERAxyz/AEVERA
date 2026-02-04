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

  // --- V2 ARCHITEKTUR: ZWEI ADRESSEN ---

  // 1. GATEWAY (Schreiben & Bezahlen)
  // Das ist dein Proxy aus adressen.txt
  GATEWAY_ADDRESS: isTestnet 
    ? "0x08E8b27d08b4F2B0a6A4b3ca5cFCD9FD0DcCDf11" 
    : "0xC626463650C39653b09DCcD33158F15419cf24ae", // <--- UPDATE: Mainnet Proxy

  // 2. VAULT (Lesen & Wahrheit)
  // Das ist dein Tresor aus adressen.txt
  VAULT_ADDRESS: isTestnet 
    ? "0x0e2504e3613a3d57d6939BB2eF55e808453e7d76" 
    : "0x0C718C8f4F851F7e6dF0F2DE1e5Ac15CC3585F15", // <--- UPDATE: Mainnet Vault

  // 3. USDC TOKEN (Bezahlen)
  // Offizielles Testnet USDC
  USDC_ADDRESS: isTestnet 
    ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" 
    : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Mainnet USDC

  EXPLORER_URL: isTestnet ? "https://sepolia.basescan.org" : "https://basescan.org",

  // --- TRANSPORT-LAYER ---
  RPC_LIST: isTestnet ? SEPOLIA_RPCS : MAINNET_RPCS,

  PUBLIC_RPC_URL: isTestnet 
    ? "https://sepolia.base.org" 
    : "https://mainnet.base.org",

  WALLET_TRANSPORT_URL: isTestnet
    ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,

  // --- IDENTITY TELESCOPE ---
  BASE_IDENTITY_URL: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  ETH_IDENTITY_URL: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, 

  // --- APP LIMITS (Iron Laws) ---
  MAX_SUPPLY_PUBLIC: 100,
  MAX_SUPPLY_PRIVATE: 1000
} as const;