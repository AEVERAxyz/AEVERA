import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CapsulePage from "@/pages/capsule";

// PROFIE-IMPORTS
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';

// 1. RainbowKit Konfiguration
const config = getDefaultConfig({
  appName: 'TimeCapsule',
  projectId: 'YOUR_PROJECT_ID', 
  chains: [base],
  ssr: true,
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/capsule/:id">
        {(params) => <CapsulePage id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* KORREKTUR: accentColorForeground statt accentColorTextColor */}
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#1652F0', 
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;