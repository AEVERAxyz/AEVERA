import React from 'react';
import { WagmiProvider, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains'; // WICHTIG: Wir importieren jetzt BEIDE
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { queryClient } from "@/lib/queryClient"; 
import '@rainbow-me/rainbowkit/styles.css';

// --- INTELLIGENTE WEICHE ---
const isProduction = typeof window !== "undefined" && (window.location.hostname === "aevera.xyz" || window.location.hostname === "www.aevera.xyz");

// Wir wählen die Chain basierend auf der Domain
const activeChain = isProduction ? base : baseSepolia;

export const config = getDefaultConfig({
  appName: 'AEVERA',
  projectId: '60bb29b162bfdc08e7238f46a70c726e',
  chains: [activeChain], // Hier wird nur die eine, richtige Chain übergeben
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
});

export function OnchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#2563eb', // AEVERA Blau
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}