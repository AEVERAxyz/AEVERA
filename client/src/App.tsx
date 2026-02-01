import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { OnchainProviders } from "./OnchainProviders";
import { RefreshCcw } from "lucide-react"; // Neu hinzugefügt für das Icon

import Home from "@/pages/Home";
import CapsulePage from "@/pages/Capsule";
import NotFound from "@/pages/NotFound";

// --- NEU: MAINTENANCE OVERLAY KOMPONENTE ---
const MaintenanceOverlay = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="max-w-md p-8 text-center border border-white/10 rounded-2xl bg-black/40 shadow-2xl mx-4">

        {/* Icon Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
            <div className="relative p-4 rounded-full bg-white/5 border border-white/10">
              <RefreshCcw className="w-8 h-8 text-blue-400 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">
          PREPARING FOR ETERNITY
        </h2>

        {/* Text */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          We are upgrading the AEVERA Protocol to a new immutable architecture. 
          <br /><br />
          This update ensures compatibility with the <strong>Agentic Economy</strong> and true permanence on Base.
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          The forge is active. We will be back shortly.
        </div>

        {/* Social Link */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <a 
            href="https://warpcast.com/~/channel/aevera" 
            target="_blank" 
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Follow updates on Farcaster
          </a>
        </div>
      </div>
    </div>
  );
};

// --- ROUTER ---
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/capsule/:id" component={CapsulePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <OnchainProviders>
      <Router />

      {/* 🔴 HIER IST DAS OVERLAY AKTIV 🔴 */}
      <MaintenanceOverlay />

      <Toaster />
    </OnchainProviders>
  );
}