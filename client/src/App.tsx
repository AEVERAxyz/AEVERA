import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { OnchainProviders } from "./OnchainProviders";

// FIX: Importe angepasst an die neuen Dateinamen (PascalCase)
import Home from "@/pages/Home";
import CapsulePage from "@/pages/Capsule";
import NotFound from "@/pages/NotFound";
import FrameSeal from "@/pages/FrameSeal"; // NEU: Import für den Frame

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/frame" component={FrameSeal} /> {/* NEU: Die Frame Route */}
      <Route path="/capsule/:id" component={CapsulePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <OnchainProviders>
      <Router />
      <Toaster />
    </OnchainProviders>
  );
}