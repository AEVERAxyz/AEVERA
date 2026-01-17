import React from 'react';
import { WagmiProvider, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { queryClient } from "@/lib/queryClient"; 
import '@rainbow-me/rainbowkit/styles.css';

// WICHTIG: Wir exportieren 'config', damit Capsule.tsx es importieren kann!
export const config = getDefaultConfig({
  appName: 'AEVERA',
  projectId: '60bb29b162bfdc08e7238f46a70c726e',
  chains: [baseSepolia],
  transports: {
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