import React from 'react';
import { WagmiProvider, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains'; // Nur noch Base-Ketten importiert
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { queryClient } from "@/lib/queryClient";
import '@rainbow-me/rainbowkit/styles.css';

// --- ZENTRALE CONFIG IMPORTIEREN ---
import { APP_CONFIG } from "@/lib/config";

// --- NETZWERK-EINSCHRÄNKUNG ---
// Wir erlauben NUR die aktive Kette in der UI. 
// Dies verhindert, dass Ethereum oder andere Netze im Wallet-Menü erscheinen.
const chains = [APP_CONFIG.ACTIVE_CHAIN] as const;

export const config = getDefaultConfig({
  appName: 'AEVERA',
  projectId: '60bb29b162bfdc08e7238f46a70c726e', // WalletConnect ID
  chains,
  transports: {
    // Nutzt ausschließlich den Alchemy-Transport für die aktive Kette
    [APP_CONFIG.ACTIVE_CHAIN.id]: http(APP_CONFIG.WALLET_TRANSPORT_URL),
  },
  ssr: false,
});

export function OnchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#2563eb',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          coolMode
          // Erzwingt die korrekte Kette beim Verbinden
          initialChain={APP_CONFIG.ACTIVE_CHAIN}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}